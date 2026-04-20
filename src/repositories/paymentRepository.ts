import Records from "@/models/records";
import TaskNotification from "@/models/taskNotifications";
import Employee from "@/models/employees";
import Entity from "@/models/entities";
import EntityRecordStats from "@/models/entityRecordStats";
import LiabilityEntityStats from "@/models/liabilityEntityStats";
import OfficeRecordCategoryStats from "@/models/officeRecordCategoryStats";
import PaymentTemplate from "@/models/paymentTemplates";
import PaymentStatusTemplate from "@/models/paymentStatusTemplates";
import mongoose from "mongoose";

type TFindRecordsOptions = {
  populate?: any;
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
  select?: string;
  lean?: boolean;
};

export async function createRecord(data: any) {
  return Records.create(data);
}

export async function findRecordById(id: string) {
  return Records.findById(id);
}

export async function findRecordByIdLean(id: string) {
  return Records.findById(id).lean<any>();
}

export async function findRecordByIdAndPopulate(id: string, populate: any) {
  return Records.findById(id).populate(populate);
}

export async function findOneRecord(query: any, select?: string, sort?: Record<string, 1 | -1>) {
  let cursor = Records.findOne(query);
  if (sort) {
    cursor = cursor.sort(sort);
  }
  if (select) {
    cursor = cursor.select(select);
  }
  return cursor;
}

export async function findRecords(query: any, options?: TFindRecordsOptions) {
  let cursor: any = Records.find(query);

  if (options?.populate) {
    cursor = cursor.populate(options.populate);
  }
  if (options?.sort) {
    cursor = cursor.sort(options.sort);
  }
  if (typeof options?.skip === "number") {
    cursor = cursor.skip(options.skip);
  }
  if (typeof options?.limit === "number") {
    cursor = cursor.limit(options.limit);
  }
  if (options?.select) {
    cursor = cursor.select(options.select);
  }
  if (options?.lean) {
    cursor = cursor.lean();
  }

  return cursor;
}

export async function updateRecordById(id: string, update: any, options?: any) {
  return Records.findByIdAndUpdate(id, update, options);
}

export async function updateManyRecords(filter: any, update: any) {
  return Records.updateMany(filter, update);
}

export async function aggregateRecords<T = any>(pipeline: any[]) {
  return Records.aggregate<T>(pipeline);
}

export async function distinctEmployeeIdsByCompany(companyId: string) {
  return Employee.find({ published: true, company: companyId }).distinct("_id");
}

export async function findEntitiesByIds(ids: any[]) {
  return Entity.find({
    _id: { $in: ids },
    published: true,
    entityType: { $in: ["company", "employee", "individual"] },
  })
    .select("_id name entityType")
    .lean();
}

export async function findPaymentTemplateMethods() {
  return PaymentTemplate.find({ published: { $ne: false } })
    .select("_id method")
    .sort({ method: 1 });
}

export async function findPaymentStatusTemplates() {
  return PaymentStatusTemplate.find({ published: { $ne: false } })
    .select("_id status")
    .sort({ status: 1 });
}

export async function findPaymentTemplateByMethodName(method: string) {
  return PaymentTemplate.findOne({ method: new RegExp(`^${String(method || "").trim()}$`, "i") })
    .select("_id method");
}

export async function findPaymentStatusTemplateByStatusName(status: string) {
  return PaymentStatusTemplate.findOne({ status: new RegExp(`^${String(status || "").trim()}$`, "i") })
    .select("_id status");
}

export async function findPaymentTemplateById(id: string) {
  return PaymentTemplate.findById(id).select("_id method color icon published");
}

export async function findPaymentStatusTemplateById(id: string) {
  return PaymentStatusTemplate.findById(id).select("_id status color published");
}

export async function createPaymentEditNotification(data: any) {
  return TaskNotification.create(data);
}

export async function findPublishedEntityIds() {
  return Entity.find({
    published: true,
    entityType: { $in: ["company", "employee", "individual"] },
  })
    .select("_id")
    .lean();
}

export async function aggregateEntityRecordStatsByEntityIds(entityIds?: string[]) {
  const matchStage: Record<string, any> = {
    deletedAt: null,
    entity: { $ne: null },
    recordKind: { $ne: "liability" },
  };

  if (entityIds && entityIds.length > 0) {
    const objectIds = entityIds
      .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
      .map((id) => new mongoose.Types.ObjectId(String(id)));

    if (!objectIds.length) {
      return [];
    }

    matchStage.entity = { $in: objectIds };
  }

  return Records.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "entities",
        localField: "entity",
        foreignField: "_id",
        as: "entityDoc",
      },
    },
    { $unwind: "$entityDoc" },
    { $match: { "entityDoc.published": true } },
    {
      $group: {
        _id: "$entity",
        totalTransactions: { $sum: 1 },
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, { $ifNull: ["$amount", 0] }, 0],
          },
        },
        totalExpense: {
          $sum: {
            $cond: [
              { $eq: ["$type", "expense"] },
              { $add: [{ $ifNull: ["$amount", 0] }, { $ifNull: ["$serviceFee", 0] }] },
              0,
            ],
          },
        },
      },
    },
  ]);
}

export async function bulkUpsertEntityRecordStats(statsRows: any[]) {
  if (!statsRows.length) {
    return null;
  }

  return EntityRecordStats.bulkWrite(
    statsRows.map((row) => ({
      updateOne: {
        filter: { entity: row.entity },
        update: {
          $set: {
            published: true,
            totalIncome: row.totalIncome,
            totalExpense: row.totalExpense,
            totalTransactions: row.totalTransactions,
            balance: row.balance,
            lastRecomputedAt: row.lastRecomputedAt || new Date(),
          },
        },
        upsert: true,
      },
    })),
  );
}

export async function findEntityRecordStatsByEntityIds(entityIds: string[]) {
  if (!entityIds.length) {
    return [];
  }

  return EntityRecordStats.find({ entity: { $in: entityIds }, published: true })
    .select("entity totalIncome totalExpense totalTransactions balance lastRecomputedAt")
    .lean();
}

export async function ensureEntityRecordStats(entityId: string) {
  return EntityRecordStats.findOneAndUpdate(
    { entity: entityId },
    {
      $setOnInsert: {
        entity: entityId,
        totalIncome: 0,
        totalExpense: 0,
        totalTransactions: 0,
        balance: 0,
        lastRecomputedAt: new Date(),
      },
      $set: {
        published: true,
      },
    },
    { upsert: true, new: true },
  );
}

export async function unpublishEntityRecordStats(entityId: string) {
  return EntityRecordStats.findOneAndUpdate(
    { entity: entityId },
    {
      $set: {
        published: false,
      },
    },
    { new: true },
  );
}

export async function aggregateOfficeRecordCategoryStatsByKeys(categoryKeys?: string[]) {
  const matchStage: Record<string, any> = {
    deletedAt: null,
    recordKind: "office_records",
  };

  if (categoryKeys && categoryKeys.length > 0) {
    const normalizedKeys = Array.from(new Set(categoryKeys.map((value) => String(value || "").trim()).filter(Boolean)));
    const includeUncategorized = normalizedKeys.includes("__uncategorized__");
    const objectIds = normalizedKeys
      .filter((key) => key !== "__uncategorized__")
      .filter((key) => mongoose.Types.ObjectId.isValid(key))
      .map((key) => new mongoose.Types.ObjectId(key));

    const categoryOrClauses: any[] = [];
    if (objectIds.length > 0) {
      categoryOrClauses.push({ category: { $in: objectIds } });
    }
    if (includeUncategorized) {
      categoryOrClauses.push({ category: null });
    }

    if (!categoryOrClauses.length) {
      return [];
    }

    matchStage.$or = categoryOrClauses;
  }

  return Records.aggregate([
    { $match: matchStage },
    {
      $addFields: {
        categoryKey: {
          $ifNull: [{ $toString: "$category" }, "__uncategorized__"],
        },
      },
    },
    {
      $group: {
        _id: "$categoryKey",
        category: { $first: "$category" },
        incomeTotal: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, { $ifNull: ["$amount", 0] }, 0],
          },
        },
        incomeCount: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, 1, 0],
          },
        },
        expenseTotal: {
          $sum: {
            $cond: [
              { $eq: ["$type", "expense"] },
              { $add: [{ $ifNull: ["$amount", 0] }, { $ifNull: ["$serviceFee", 0] }] },
              0,
            ],
          },
        },
        expenseCount: {
          $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, 1, 0],
          },
        },
        totalCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "officeExpenseCategories",
        localField: "category",
        foreignField: "_id",
        as: "categoryDoc",
      },
    },
    {
      $addFields: {
        categoryLabel: {
          $ifNull: [{ $arrayElemAt: ["$categoryDoc.category", 0] }, "Office"],
        },
      },
    },
    {
      $project: {
        _id: 1,
        category: 1,
        categoryLabel: 1,
        incomeTotal: 1,
        incomeCount: 1,
        expenseTotal: 1,
        expenseCount: 1,
        totalCount: 1,
      },
    },
  ]);
}

export async function bulkUpsertOfficeRecordCategoryStats(statsRows: any[]) {
  if (!statsRows.length) {
    return null;
  }

  return OfficeRecordCategoryStats.bulkWrite(
    statsRows.map((row) => ({
      updateOne: {
        filter: { categoryKey: row.categoryKey },
        update: {
          $set: {
            published: true,
            category: row.category || null,
            categoryLabel: row.categoryLabel || "Office",
            incomeTotal: row.incomeTotal || 0,
            incomeCount: row.incomeCount || 0,
            expenseTotal: row.expenseTotal || 0,
            expenseCount: row.expenseCount || 0,
            totalCount: row.totalCount || 0,
            lastRecomputedAt: row.lastRecomputedAt || new Date(),
          },
        },
        upsert: true,
      },
    })),
  );
}

export async function findOfficeRecordCategoryStatsByKeys(categoryKeys?: string[]) {
  const query: Record<string, any> = { published: true };
  if (categoryKeys && categoryKeys.length > 0) {
    query.categoryKey = { $in: categoryKeys };
  }

  return OfficeRecordCategoryStats.find(query)
    .select("categoryKey category categoryLabel incomeTotal incomeCount expenseTotal expenseCount totalCount lastRecomputedAt")
    .lean();
}

export async function aggregateLiabilityEntityStatsByKeys(entityKeys?: string[]) {
  const matchStage: Record<string, any> = {
    deletedAt: null,
    recordKind: "liability",
  };

  if (entityKeys && entityKeys.length > 0) {
    const normalizedKeys = Array.from(new Set(entityKeys.map((value) => String(value || "").trim()).filter(Boolean)));
    const includeUnknown = normalizedKeys.includes("__unknown__");
    const objectIds = normalizedKeys
      .filter((key) => key !== "__unknown__")
      .filter((key) => mongoose.Types.ObjectId.isValid(key))
      .map((key) => new mongoose.Types.ObjectId(key));

    const entityOrClauses: any[] = [];
    if (objectIds.length > 0) {
      entityOrClauses.push({ entity: { $in: objectIds } });
    }
    if (includeUnknown) {
      entityOrClauses.push({ entity: null });
    }

    if (!entityOrClauses.length) {
      return [];
    }

    matchStage.$or = entityOrClauses;
  }

  return Records.aggregate([
    { $match: matchStage },
    {
      $addFields: {
        entityKey: {
          $ifNull: [{ $toString: "$entity" }, "__unknown__"],
        },
      },
    },
    {
      $group: {
        _id: "$entityKey",
        entity: { $first: "$entity" },
        income: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, { $ifNull: ["$amount", 0] }, 0],
          },
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, { $ifNull: ["$amount", 0] }, 0],
          },
        },
        totalTransactions: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "entities",
        localField: "entity",
        foreignField: "_id",
        as: "entityDoc",
      },
    },
    {
      $addFields: {
        entityName: {
          $ifNull: [{ $arrayElemAt: ["$entityDoc.name", 0] }, "Unknown Entity"],
        },
      },
    },
    {
      $project: {
        _id: 1,
        entity: 1,
        entityName: 1,
        income: 1,
        expense: 1,
        net: { $subtract: ["$income", "$expense"] },
        totalTransactions: 1,
      },
    },
  ]);
}

export async function bulkUpsertLiabilityEntityStats(statsRows: any[]) {
  if (!statsRows.length) {
    return null;
  }

  return LiabilityEntityStats.bulkWrite(
    statsRows.map((row) => ({
      updateOne: {
        filter: { entityKey: row.entityKey },
        update: {
          $set: {
            published: true,
            entity: row.entity || null,
            entityName: row.entityName || "Unknown Entity",
            income: row.income || 0,
            expense: row.expense || 0,
            net: row.net || 0,
            totalTransactions: row.totalTransactions || 0,
            lastRecomputedAt: row.lastRecomputedAt || new Date(),
          },
        },
        upsert: true,
      },
    })),
  );
}

export async function findLiabilityEntityStatsByKeys(entityKeys?: string[]) {
  const query: Record<string, any> = { published: true };
  if (entityKeys && entityKeys.length > 0) {
    query.entityKey = { $in: entityKeys };
  }

  return LiabilityEntityStats.find(query)
    .select("entityKey entity entityName income expense net totalTransactions lastRecomputedAt")
    .lean();
}
