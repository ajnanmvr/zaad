#!/usr/bin/env node

import { existsSync, readFileSync } from "fs";
import path from "path";
import mongoose from "mongoose";
import { randomUUID } from "crypto";

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

const SOURCE_MONGO_URI =
  process.env.SOURCE_MONGO_URI || "PASTE_OLD_DB_URI_HERE";
const TARGET_MONGO_URI =
  process.env.TARGET_MONGO_URI || "PASTE_NEW_DB_URI_HERE";

function assertConfigured(uri, label) {
  if (!uri || uri.includes("PASTE_") || uri === "") {
    throw new Error(`Please set ${label} before running the migration script.`);
  }
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function lower(value) {
  return normalizeText(value).toLowerCase();
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toDate(value, fallback = new Date()) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );
}

function hslToHex(hue, saturation, lightness) {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const normalizedSaturation = Math.max(0, Math.min(100, saturation)) / 100;
  const normalizedLightness = Math.max(0, Math.min(100, lightness)) / 100;

  const chroma = (1 - Math.abs(2 * normalizedLightness - 1)) * normalizedSaturation;
  const secondary = chroma * (1 - Math.abs((normalizedHue / 60) % 2 - 1));
  const match = normalizedLightness - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (normalizedHue < 60) {
    red = chroma;
    green = secondary;
  } else if (normalizedHue < 120) {
    red = secondary;
    green = chroma;
  } else if (normalizedHue < 180) {
    green = chroma;
    blue = secondary;
  } else if (normalizedHue < 240) {
    green = secondary;
    blue = chroma;
  } else if (normalizedHue < 300) {
    red = secondary;
    blue = chroma;
  } else {
    red = chroma;
    blue = secondary;
  }

  const toHex = (channel) => Math.round((channel + match) * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function getDistinctColor(index) {
  return hslToHex(index * 137.508, 72, 58);
}

function inferRecordKind(sourceRecord) {
  const status = lower(sourceRecord?.status);
  const self = lower(sourceRecord?.self);
  const method = lower(sourceRecord?.method);

  const isSelfDeposit =
    status === "self deposit" || self === "zaad(self deposit)";
  if (isSelfDeposit) {
    return "self_transfer";
  }

  if (self === "zaad") {
    return "office_records";
  }

  if (
    method === "liability" ||
    method === "liabilty" ||
    status === "liability"
  ) {
    return "liability";
  }

  return "standard";
}

function shouldCreateStatusTemplate(statusRaw) {
  const status = lower(statusRaw);
  if (!status) {
    return false;
  }

  return status !== "liability" && status !== "self deposit";
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

async function loadTemplateMap(collection, fieldName) {
  const rows = await collection.find({}, { projection: { [fieldName]: 1 } }).toArray();
  const map = new Map();

  for (const row of rows) {
    const key = lower(row?.[fieldName]);
    if (!key) {
      continue;
    }

    map.set(key, row._id);
  }

  return map;
}

async function ensurePaymentMethodTemplate(collection, methodMap, methodName) {
  const normalizedMethod = lower(methodName);
  if (!normalizedMethod) {
    return null;
  }

  const existing = methodMap.get(normalizedMethod);
  if (existing) {
    return existing;
  }

  const now = new Date();
  const insertResult = await collection.insertOne({
    method: normalizedMethod,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  methodMap.set(normalizedMethod, insertResult.insertedId);
  return insertResult.insertedId;
}

async function ensureStatusTemplate(collection, statusMap, statusName, type) {
  const normalizedStatus = lower(statusName);
  if (!normalizedStatus) {
    return null;
  }

  const existing = statusMap.get(normalizedStatus);
  if (existing) {
    return existing;
  }

  const appliesTo = type === "income" || type === "expense" ? type : "both";
  const now = new Date();
  const insertResult = await collection.insertOne({
    status: normalizedStatus,
    appliesTo,
    color: getDistinctColor(statusMap.size),
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  statusMap.set(normalizedStatus, insertResult.insertedId);
  return insertResult.insertedId;
}

async function ensureOfficeOtherCategory(collection) {
  const existing = await collection.findOne({ category: { $regex: /^other$/i } });
  if (existing?._id) {
    return existing._id;
  }

  const now = new Date();
  const insertResult = await collection.insertOne({
    category: "Other",
    color: "#0F766E",
    icon: "briefcase",
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  return insertResult.insertedId;
}

async function migrate() {
  assertConfigured(SOURCE_MONGO_URI, "SOURCE_MONGO_URI");
  assertConfigured(TARGET_MONGO_URI, "TARGET_MONGO_URI");

  const sourceConnection = await connectDatabase(SOURCE_MONGO_URI, "Source");
  const targetConnection = await connectDatabase(TARGET_MONGO_URI, "Target");

  try {
    const sourceDb = sourceConnection.db;
    const targetDb = targetConnection.db;

    const sourceRecords = await sourceDb.collection("records").find({}).toArray();

    const targetRecords = targetDb.collection("records");
    const paymentTemplates = targetDb.collection("paymentTemplates");
    const paymentStatusTemplates = targetDb.collection("paymentStatusTemplates");
    const officeExpenseCategories = targetDb.collection("officeExpenseCategories");

    const paymentMethodMap = await loadTemplateMap(paymentTemplates, "method");
    const statusMap = await loadTemplateMap(paymentStatusTemplates, "status");
    const officeOtherCategoryId = await ensureOfficeOtherCategory(officeExpenseCategories);

    const counters = {
      recordsScanned: 0,
      recordsMigrated: 0,
      recordsUpdated: 0,
      recordsSkippedUnpublished: 0,
      selfTransferCount: 0,
      officeRecordCount: 0,
      liabilityCount: 0,
      standardCount: 0,
    };

    for (const sourceRecord of sourceRecords) {
      counters.recordsScanned += 1;

      if (sourceRecord?.published === false) {
        counters.recordsSkippedUnpublished += 1;
        continue;
      }

      const recordKind = inferRecordKind(sourceRecord);
      const type = lower(sourceRecord?.type) === "income" ? "income" : "expense";

      let methodId;
      if (recordKind !== "liability") {
        methodId = await ensurePaymentMethodTemplate(
          paymentTemplates,
          paymentMethodMap,
          sourceRecord?.method
        );
      }

      let statusId;
      if (shouldCreateStatusTemplate(sourceRecord?.status)) {
        statusId = await ensureStatusTemplate(
          paymentStatusTemplates,
          statusMap,
          sourceRecord?.status,
          type
        );
      }

      const entityId = sourceRecord?.employee || sourceRecord?.company || undefined;

      const payload = compactObject({
        _id: sourceRecord._id,
        suffix: normalizeText(sourceRecord?.suffix) || undefined,
        number: toNumber(sourceRecord?.number, 0),
        particular: normalizeText(sourceRecord?.particular) || "Untitled",
        serviceFee: toNumber(sourceRecord?.serviceFee, 0),
        amount: toNumber(sourceRecord?.amount, 0),
        method: methodId,
        type,
        entity: entityId,
        status: statusId,
        recordKind,
        transferGroupId:
          recordKind === "self_transfer"
            ? normalizeText(sourceRecord?.transferGroupId) || randomUUID()
            : undefined,
        category: recordKind === "office_records" ? officeOtherCategoryId : undefined,
        createdBy: sourceRecord?.createdBy || undefined,
        remarks: normalizeText(sourceRecord?.remarks) || undefined,
        edited: Boolean(sourceRecord?.edited),
        deletedAt: sourceRecord?.deletedAt || null,
        createdAt: toDate(sourceRecord?.createdAt),
        updatedAt: toDate(sourceRecord?.updatedAt),
      });

      const result = await targetRecords.replaceOne(
        { _id: sourceRecord._id },
        payload,
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        counters.recordsMigrated += 1;
      } else if (result.modifiedCount > 0) {
        counters.recordsUpdated += 1;
      }

      if (recordKind === "self_transfer") {
        counters.selfTransferCount += 1;
      } else if (recordKind === "office_records") {
        counters.officeRecordCount += 1;
      } else if (recordKind === "liability") {
        counters.liabilityCount += 1;
      } else {
        counters.standardCount += 1;
      }
    }

    console.log(JSON.stringify(counters, null, 2));
  } finally {
    await sourceConnection.close();
    await targetConnection.close();
  }
}

migrate().catch((error) => {
  console.error("Record migration failed:", error);
  process.exitCode = 1;
});
