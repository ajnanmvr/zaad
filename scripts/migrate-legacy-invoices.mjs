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

function toDateString(value) {
  return normalizeText(value) || undefined;
}

function normalizeBooleanString(value) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "true" || normalized === "false") {
    return normalized;
  }

  return undefined;
}

function normalizeInvoiceItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      title: normalizeText(item?.title),
      desc: normalizeText(item?.desc),
      rate: Number(item?.rate) || 0,
      quantity: Number(item?.quantity) || 0,
    }))
    .filter((item) => item.title || item.desc || item.rate || item.quantity);
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

async function migrate() {
  assertConfigured(SOURCE_MONGO_URI, "SOURCE_MONGO_URI");
  assertConfigured(TARGET_MONGO_URI, "TARGET_MONGO_URI");

  const sourceConnection = await connectDatabase(SOURCE_MONGO_URI, "Source");
  const targetConnection = await connectDatabase(TARGET_MONGO_URI, "Target");

  try {
    const sourceDb = sourceConnection.db;
    const targetDb = targetConnection.db;

    const sourceInvoices = await sourceDb.collection("invoices").find({}).toArray();
    const targetInvoices = targetDb.collection("invoices");

    let scanned = 0;
    let migrated = 0;
    let updated = 0;
    let skippedUnpublished = 0;

    for (const sourceInvoice of sourceInvoices) {
      scanned += 1;

      if (sourceInvoice?.published === false) {
        skippedUnpublished += 1;
        continue;
      }

      const payload = {
        _id: sourceInvoice._id,
        title: normalizeText(sourceInvoice?.title) || undefined,
        suffix: normalizeText(sourceInvoice?.suffix) || undefined,
        invoiceNo: Number(sourceInvoice?.invoiceNo) || 0,
        client: normalizeText(sourceInvoice?.client) || undefined,
        entityId: sourceInvoice?.entityId || null,
        entityType: sourceInvoice?.entityType || null,
        location: normalizeText(sourceInvoice?.location) || undefined,
        trn: normalizeText(sourceInvoice?.trn) || undefined,
        purpose: normalizeText(sourceInvoice?.purpose) || undefined,
        advance: Number(sourceInvoice?.advance) || 0,
        showBalance: normalizeBooleanString(sourceInvoice?.showBalance),
        createdBy: sourceInvoice?.createdBy || undefined,
        published: true,
        date: toDateString(sourceInvoice?.date),
        validTo: toDateString(sourceInvoice?.validTo),
        quotation: normalizeText(sourceInvoice?.quotation) || undefined,
        message: normalizeText(sourceInvoice?.message) || undefined,
        items: normalizeInvoiceItems(sourceInvoice?.items),
        remarks: normalizeText(sourceInvoice?.remarks) || undefined,
        createdAt: sourceInvoice?.createdAt || new Date(),
        updatedAt: sourceInvoice?.updatedAt || new Date(),
      };

      const result = await targetInvoices.replaceOne(
        { _id: sourceInvoice._id },
        payload,
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        migrated += 1;
      } else if (result.modifiedCount > 0) {
        updated += 1;
      }
    }

    console.log(
      JSON.stringify(
        {
          invoicesScanned: scanned,
          invoicesMigrated: migrated,
          invoicesUpdated: updated,
          invoicesSkippedUnpublished: skippedUnpublished,
        },
        null,
        2
      )
    );
  } finally {
    await sourceConnection.close();
    await targetConnection.close();
  }
}

migrate().catch((error) => {
  console.error("Invoice migration failed:", error);
  process.exitCode = 1;
});