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
  process.env.TARGET_MONGO_URI || process.env.MONGO_URI || "PASTE_NEW_DB_URI_HERE";
const BULK_FILE_PATH = path.join(process.cwd(), "scripts", "employees-bulk.json");

function assertConfigured(uri, label) {
  if (!uri || uri.includes("PASTE_") || uri === "") {
    throw new Error(`Please set ${label} before running the bulk upload script.`);
  }
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toObjectId(value) {
  const raw = normalizeText(value);
  return mongoose.Types.ObjectId.isValid(raw) ? new mongoose.Types.ObjectId(raw) : null;
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

  const toHex = (channel) =>
    Math.round((channel + match) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function getDistinctColor(index) {
  return hslToHex(index * 137.508, 72, 58);
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

function loadBulkEmployees() {
  if (!existsSync(BULK_FILE_PATH)) {
    throw new Error(`Bulk file not found: ${BULK_FILE_PATH}`);
  }

  const raw = readFileSync(BULK_FILE_PATH, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("employees-bulk.json must contain an array of employee rows.");
  }

  return parsed;
}

async function migrate() {
  assertConfigured(TARGET_MONGO_URI, "TARGET_MONGO_URI");

  const sourceRows = loadBulkEmployees();
  const connection = await connectDatabase(TARGET_MONGO_URI, "Target");

  try {
    const db = connection.db;
    const entities = db.collection("entities");

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const [index, row] of sourceRows.entries()) {
      const name = normalizeText(row?.name);
      const companyId = toObjectId(row?.company);

      if (!name || !companyId) {
        skipped += 1;
        continue;
      }

      const now = new Date();
      const payload = {
        name,
        company: companyId,
        entityType: "employee",
        isActive: true,
        published: true,
        color: getDistinctColor(index),
        updatedAt: now,
      };

      const result = await entities.updateOne(
        { entityType: "employee", name, company: companyId },
        {
          $set: payload,
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        inserted += 1;
      } else if (result.modifiedCount > 0) {
        updated += 1;
      }
    }

    console.log(
      JSON.stringify(
        {
          file: path.relative(process.cwd(), BULK_FILE_PATH),
          scanned: sourceRows.length,
          inserted,
          updated,
          skipped,
        },
        null,
        2
      )
    );
  } finally {
    await connection.close();
  }
}

migrate().catch((error) => {
  console.error("Employee bulk upload failed:", error);
  process.exitCode = 1;
});
