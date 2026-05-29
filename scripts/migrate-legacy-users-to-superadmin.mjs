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

const SUPER_ADMIN_ROLE = "super-admin";

function assertConfigured(uri, label) {
  if (!uri || uri.includes("PASTE_") || uri === "") {
    throw new Error(`Please set ${label} before running the migration script.`);
  }
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toDate(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
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

async function ensureSuperAdminRole(targetDb) {
  const roleCollection = targetDb.collection("roles");
  const existing = await roleCollection.findOne({ name: SUPER_ADMIN_ROLE });

  if (existing) {
    return existing._id;
  }

  const roleId = new mongoose.Types.ObjectId("69d66e9a9f08bfb33e877b90");
  const now = new Date();

  await roleCollection.insertOne({
    _id: roleId,
    name: SUPER_ADMIN_ROLE,
    description: "Platform super administrator",
    permissions: ["*"],
    isSystem: true,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  return roleId;
}

async function migrate() {
  assertConfigured(SOURCE_MONGO_URI, "SOURCE_MONGO_URI");
  assertConfigured(TARGET_MONGO_URI, "TARGET_MONGO_URI");

  const sourceConnection = await connectDatabase(SOURCE_MONGO_URI, "Source");
  const targetConnection = await connectDatabase(TARGET_MONGO_URI, "Target");

  try {
    const sourceDb = sourceConnection.db;
    const targetDb = targetConnection.db;

    await ensureSuperAdminRole(targetDb);

    const sourceUsers = await sourceDb.collection("users").find({}).toArray();
    const targetUsers = targetDb.collection("users");

    let migrated = 0;
    let updated = 0;

    for (const sourceUser of sourceUsers) {
      const username = normalizeText(sourceUser?.username);
      if (!username) {
        continue;
      }

      if (sourceUser?.published === false) {
        continue;
      }

      const password = normalizeText(sourceUser?.password);
      if (!password) {
        continue;
      }

      const payload = {
        _id: sourceUser._id,
        username,
        fullname: normalizeText(sourceUser?.fullname) || undefined,
        password,
        role: SUPER_ADMIN_ROLE,
        published: sourceUser?.published !== false,
        deletedAt: toDate(sourceUser?.deletedAt, null),
        passwordChangedAt: null,
        failedLoginCount: 0,
        lockUntil: null,
        mfaEnabled: false,
        roleVersion: 1,
        updatedAt: toDate(sourceUser?.updatedAt, new Date()),
      };

      const result = await targetUsers.updateOne(
        { _id: sourceUser._id },
        {
          $set: payload,
          $setOnInsert: {
            createdAt: payload.createdAt,
          },
        },
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
          usersScanned: sourceUsers.length,
          usersMigrated: migrated,
          usersUpdated: updated,
          roleAssigned: SUPER_ADMIN_ROLE,
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
  console.error("User migration failed:", error);
  process.exitCode = 1;
});