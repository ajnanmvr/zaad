#!/usr/bin/env node

import { existsSync, readFileSync } from "fs";
import path from "path";
import mongoose from "mongoose";

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const TARGET_MONGO_URI =
  process.env.TARGET_MONGO_URI || "PASTE_NEW_DB_URI_HERE";

function assertConfigured(uri, label) {
  if (!uri || uri.includes("PASTE_") || uri === "") {
    throw new Error(`Please set ${label} before running the migration script.`);
  }
}

async function connectDatabase(uri, label) {
  const connection = await mongoose
    .createConnection(uri, { bufferCommands: false })
    .asPromise();

  connection.on("error", (error) => {
    console.error(`${label} connection error:`, error);
  });

  return connection;
}

async function refreshEntityRecordStats(db) {
  const records = db.collection("records");
  const entities = db.collection("entities");
  const statsCollection = db.collection("entity_record_stats");

  // Get all unique entities from records
  const entityRecords = await records
    .aggregate([
      { $match: { entity: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$entity",
          totalIncome: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
          },
          totalServiceFee: { $sum: "$serviceFee" },
          totalTransactions: { $sum: 1 },
        },
      },
    ])
    .toArray();

  let statsUpdated = 0;

  for (const stat of entityRecords) {
    const entityId = stat._id;
    const entity = await entities.findOne({ _id: entityId });

    if (!entity) {
      continue;
    }

    const balance =
      stat.totalIncome - stat.totalExpense - stat.totalServiceFee;

    const result = await statsCollection.updateOne(
      { entity: entityId },
      {
        $set: {
          entity: entityId,
          entityType: entity.entityType,
          totalIncome: stat.totalIncome,
          totalExpense: stat.totalExpense,
          totalServiceFee: stat.totalServiceFee,
          totalTransactions: stat.totalTransactions,
          balance,
          lastRecomputedAt: new Date(),
          published: entity.published !== false,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0 || result.modifiedCount > 0) {
      statsUpdated += 1;
    }
  }

  return statsUpdated;
}

async function refreshMonthlyFinanceStats(db) {
  const records = db.collection("records");
  const paymentTemplates = db.collection("paymentTemplates");
  const officeExpenseCategories = db.collection("officeExpenseCategories");
  const statsCollection = db.collection("monthly_finance_stats");

  // Get all records grouped by month
  const monthlyRecords = await records
    .aggregate([
      {
        $addFields: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: {
            year: "$year",
            month: "$month",
          },
          records: { $push: "$$ROOT" },
          totalTransactions: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])
    .toArray();

  let statsUpdated = 0;

  for (const monthData of monthlyRecords) {
    const { year, month } = monthData._id;
    const recordList = monthData.records;

    // Calculate office records stats
    let officeRecordsIncome = 0;
    let officeRecordsExpense = 0;
    const categoriesMap = new Map();

    // Calculate payment methods stats
    const methodsMap = new Map();
    let totalProfit = 0;

    for (const record of recordList) {
      const isIncome = record.type === "income";
      const amount = record.amount || 0;
      const serviceFee = record.serviceFee || 0;

      if (record.recordKind === "office_records") {
        if (isIncome) {
          officeRecordsIncome += amount;
        } else {
          officeRecordsExpense += amount;
        }

        // Track by category
        if (record.category) {
          const categoryId = String(record.category);
          if (!categoriesMap.has(categoryId)) {
            const category = await officeExpenseCategories.findOne({
              _id: record.category,
            });
            categoriesMap.set(categoryId, {
              categoryId,
              categoryLabel: category?.label || "Unknown",
              income: 0,
              expense: 0,
              balance: 0,
            });
          }

          const catStat = categoriesMap.get(categoryId);
          if (isIncome) {
            catStat.income += amount;
          } else {
            catStat.expense += amount;
          }
          catStat.balance = catStat.income - catStat.expense;
        }
      }

      if (record.method) {
        const methodId = String(record.method);
        if (!methodsMap.has(methodId)) {
          const method = await paymentTemplates.findOne({
            _id: record.method,
          });
          methodsMap.set(methodId, {
            methodId,
            methodLabel: method?.method || "Unknown",
            income: 0,
            expense: 0,
            balance: 0,
          });
        }

        const methodStat = methodsMap.get(methodId);
        if (isIncome) {
          methodStat.income += amount;
        } else {
          methodStat.expense += amount;
        }
        methodStat.balance = methodStat.income - methodStat.expense;
      }

      // Calculate profit
      if (record.recordKind !== "office_records") {
        totalProfit += isIncome ? amount : -amount;
      }
    }

    const netProfit = totalProfit + officeRecordsIncome - officeRecordsExpense;

    const result = await statsCollection.updateOne(
      { year, month },
      {
        $set: {
          year,
          month,
          totalTransactions: recordList.length,
          officeRecords: {
            totalIncome: officeRecordsIncome,
            totalExpense: officeRecordsExpense,
            byCategory: Array.from(categoriesMap.values()),
          },
          profit: totalProfit,
          netProfit,
          paymentMethods: Array.from(methodsMap.values()),
          lastRecomputedAt: new Date(),
          published: true,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0 || result.modifiedCount > 0) {
      statsUpdated += 1;
    }
  }

  return statsUpdated;
}

async function refreshLiabilityEntityStats(db) {
  const records = db.collection("records");
  const entities = db.collection("entities");
  const statsCollection = db.collection("liability_entity_stats");

  // Get all liability records grouped by entity
  const liabilityRecords = await records
    .aggregate([
      { $match: { recordKind: "liability", entity: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$entity",
          income: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
          },
          expense: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
          },
          totalTransactions: { $sum: 1 },
        },
      },
    ])
    .toArray();

  let statsUpdated = 0;

  for (const stat of liabilityRecords) {
    const entityId = stat._id;
    const entity = await entities.findOne({ _id: entityId });

    if (!entity) {
      continue;
    }

    const net = stat.income - stat.expense;
    const entityKey = `${String(entityId)}-liability`;

    const result = await statsCollection.updateOne(
      { entityKey },
      {
        $set: {
          entityKey,
          entity: entityId,
          entityName: entity.name || "Unknown",
          income: stat.income,
          expense: stat.expense,
          net,
          totalTransactions: stat.totalTransactions,
          lastRecomputedAt: new Date(),
          published: entity.published !== false,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0 || result.modifiedCount > 0) {
      statsUpdated += 1;
    }
  }

  return statsUpdated;
}

async function refreshOfficeRecordCategoryStats(db) {
  const records = db.collection("records");
  const categories = db.collection("officeExpenseCategories");
  const statsCollection = db.collection("office_record_category_stats");

  // Get all office records grouped by category
  const categoryRecords = await records
    .aggregate([
      { $match: { recordKind: "office_records", category: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$category",
          incomeTotal: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
          },
          incomeCount: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, 1, 0] },
          },
          expenseTotal: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
          },
          expenseCount: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, 1, 0] },
          },
        },
      },
    ])
    .toArray();

  let statsUpdated = 0;

  for (const stat of categoryRecords) {
    const categoryId = stat._id;
    const category = await categories.findOne({ _id: categoryId });

    if (!category) {
      continue;
    }

    const totalCount = stat.incomeCount + stat.expenseCount;
    const categoryKey = `${String(categoryId)}-office`;

    const result = await statsCollection.updateOne(
      { categoryKey },
      {
        $set: {
          categoryKey,
          category: categoryId,
          categoryLabel: category.label || "Unknown",
          incomeTotal: stat.incomeTotal,
          incomeCount: stat.incomeCount,
          expenseTotal: stat.expenseTotal,
          expenseCount: stat.expenseCount,
          totalCount,
          lastRecomputedAt: new Date(),
          published: category.published !== false,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0 || result.modifiedCount > 0) {
      statsUpdated += 1;
    }
  }

  return statsUpdated;
}

async function refresh() {
  assertConfigured(TARGET_MONGO_URI, "TARGET_MONGO_URI");

  const targetConnection = await connectDatabase(TARGET_MONGO_URI, "Target");

  try {
    const targetDb = targetConnection.db;

    console.log("Refreshing precomputed data...\n");

    console.log("Refreshing entity record stats...");
    const entityStatsCount = await refreshEntityRecordStats(targetDb);
    console.log(`  ✓ Updated ${entityStatsCount} entity stats\n`);

    console.log("Refreshing monthly finance stats...");
    const monthlyStatsCount = await refreshMonthlyFinanceStats(targetDb);
    console.log(`  ✓ Updated ${monthlyStatsCount} monthly stats\n`);

    console.log("Refreshing liability entity stats...");
    const liabilityStatsCount = await refreshLiabilityEntityStats(targetDb);
    console.log(`  ✓ Updated ${liabilityStatsCount} liability stats\n`);

    console.log("Refreshing office record category stats...");
    const categoryStatsCount = await refreshOfficeRecordCategoryStats(targetDb);
    console.log(`  ✓ Updated ${categoryStatsCount} category stats\n`);

    console.log(
      JSON.stringify(
        {
          entityStatsRefreshed: entityStatsCount,
          monthlyStatsRefreshed: monthlyStatsCount,
          liabilityStatsRefreshed: liabilityStatsCount,
          categoryStatsRefreshed: categoryStatsCount,
        },
        null,
        2
      )
    );
  } finally {
    await targetConnection.close();
  }
}

refresh().catch((error) => {
  console.error("Precomputed data refresh failed:", error);
  process.exitCode = 1;
});
