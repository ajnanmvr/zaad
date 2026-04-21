#!/usr/bin/env node

import { existsSync, readFileSync } from "fs";
import path from "path";
import crypto from "crypto";
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
  process.env.SOURCE_MONGO_URI || "mongodb://localhost:27017/data";
const TARGET_MONGO_URI =
  process.env.TARGET_MONGO_URI || "mongodb://localhost:27017/zaadnew";

const FALLBACK_DOCUMENT_TEMPLATE_NAME = "Legacy document";
const LEGACY_INDIVIDUAL_COMPANY_ID = "66928f485c187393797b867e";

function assertConfigured(uri, label) {
  if (!uri || uri.includes("PASTE_") || uri === "") {
    throw new Error(`Please set ${label} before running the migration script.`);
  }
}

function isValidDate(value) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function toDate(value, fallback = new Date()) {
  return isValidDate(value) ? new Date(value) : fallback;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
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

function getDistinctEntityColor(index) {
  return hslToHex(index * 137.508, 72, 58);
}

function inferDocumentCategory(name) {
  const normalized = name.toLowerCase();
  if (
    normalized.includes("visa") ||
    normalized.includes("residence") ||
    normalized.includes("entry permit")
  ) {
    return "visa";
  }

  if (
    normalized.includes("license") ||
    normalized.includes("licence") ||
    normalized.includes("trade license") ||
    normalized.includes("commercial license")
  ) {
    return "license";
  }

  return "other";
}

function composeDocumentNotes(sourceDocument) {
  return normalizeText(sourceDocument?.name);
}

function getEncryptionKey() {
  const source =
    process.env.CREDENTIALS_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    "dev-only-change-this-key";
  return crypto.createHash("sha256").update(source).digest();
}

function encryptCredential(value) {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
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

async function loadTemplateMap(targetCollection, keyField) {
  const rows = await targetCollection
    .find({}, { projection: { [keyField]: 1 } })
    .toArray();
  const map = new Map();

  for (const row of rows) {
    const key = normalizeText(row?.[keyField]).toLowerCase();
    if (key) {
      map.set(key, row._id);
    }
  }

  return map;
}

async function ensureDocumentTemplate(targetCollection, templateMap, name) {
  const trimmedName = normalizeText(name) || FALLBACK_DOCUMENT_TEMPLATE_NAME;
  const mapKey = trimmedName.toLowerCase();
  const existingId = templateMap.get(mapKey);

  if (existingId) {
    return existingId;
  }

  const now = new Date();
  const insertResult = await targetCollection.insertOne({
    name: trimmedName,
    category: inferDocumentCategory(trimmedName),
    color: getDistinctEntityColor(templateMap.size),
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  templateMap.set(mapKey, insertResult.insertedId);
  return insertResult.insertedId;
}

async function ensureCredentialTemplate(targetCollection, templateMap, platform) {
  const trimmedPlatform = normalizeText(platform);
  if (!trimmedPlatform) {
    return null;
  }

  const mapKey = trimmedPlatform.toLowerCase();
  const existingId = templateMap.get(mapKey);

  if (existingId) {
    return existingId;
  }

  const now = new Date();
  const insertResult = await targetCollection.insertOne({
    platform: trimmedPlatform,
    color: getDistinctEntityColor(templateMap.size),
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  templateMap.set(mapKey, insertResult.insertedId);
  return insertResult.insertedId;
}

async function migrateEntityPayload({
  entityCollection,
  sourceEntity,
  entityId,
  entityType,
  companyRef,
  color,
}) {
  const basePayload = {
    name: normalizeText(sourceEntity?.name),
    phone1: normalizeText(sourceEntity?.phone1) || undefined,
    phone2: normalizeText(sourceEntity?.phone2) || undefined,
    email: normalizeText(sourceEntity?.email) || undefined,
    remarks: normalizeText(sourceEntity?.remarks) || undefined,
    published: sourceEntity?.published !== false,
    color,
    entityType,
    updatedAt: toDate(sourceEntity?.updatedAt),
  };

  const entityPayload =
    entityType === "company"
      ? {
          ...basePayload,
          licenseNo: normalizeText(sourceEntity?.licenseNo) || undefined,
          companyType: normalizeText(sourceEntity?.companyType) || undefined,
          emirates: normalizeText(sourceEntity?.emirates) || undefined,
          transactionNo: normalizeText(sourceEntity?.transactionNo) || undefined,
          isMainland: normalizeText(sourceEntity?.isMainland) || undefined,
        }
      : {
          ...basePayload,
          isActive: sourceEntity?.isActive !== false,
          emiratesId: normalizeText(sourceEntity?.emiratesId) || undefined,
          nationality: normalizeText(sourceEntity?.nationality) || undefined,
          designation: normalizeText(sourceEntity?.designation) || undefined,
          ...(entityType === "employee" && companyRef ? { company: companyRef } : {}),
        };

  await entityCollection.updateOne(
    { _id: entityId },
    {
      $set: entityPayload,
      $setOnInsert: {
        createdAt: toDate(sourceEntity?.createdAt),
      },
    },
    { upsert: true }
  );
}

async function migrateEntityDocuments({
  documentCollection,
  credentialCollection,
  targetDocumentTemplates,
  targetCredentialTemplates,
  documentTemplateMap,
  credentialTemplateMap,
  sourceEntity,
  entityId,
  counters,
}) {
  const legacyDocuments = Array.isArray(sourceEntity?.documents)
    ? sourceEntity.documents
    : [];
  const legacyPasswords = Array.isArray(sourceEntity?.password)
    ? sourceEntity.password
    : [];

  await documentCollection.deleteMany({ entity: entityId });
  await credentialCollection.deleteMany({ entity: entityId });

  const migratedDocuments = [];
  for (const legacyDocument of legacyDocuments) {
    const issueDate = normalizeText(legacyDocument?.issueDate);
    const expiryDate = normalizeText(legacyDocument?.expiryDate);
    if (!issueDate && !expiryDate) {
      continue;
    }

    const templateName = normalizeText(legacyDocument?.name);
    const documentTemplateId = await ensureDocumentTemplate(
      targetDocumentTemplates,
      documentTemplateMap,
      templateName
    );

    migratedDocuments.push({
      entity: entityId,
      documentTemplate: documentTemplateId,
      issueDate: issueDate || undefined,
      expiryDate: expiryDate || undefined,
      notes: composeDocumentNotes(legacyDocument) || undefined,
      archived: false,
      archiveNotes: undefined,
      archivedAt: null,
      createdAt: toDate(sourceEntity?.updatedAt || sourceEntity?.createdAt),
      updatedAt: toDate(sourceEntity?.updatedAt || sourceEntity?.createdAt),
    });
  }

  if (migratedDocuments.length > 0) {
    await documentCollection.insertMany(migratedDocuments);
    counters.documentsInserted += migratedDocuments.length;
  }

  const migratedCredentials = [];
  for (const legacyPassword of legacyPasswords) {
    const platform = normalizeText(legacyPassword?.platform);
    const plainSecret = normalizeText(legacyPassword?.password);

    if (!plainSecret) {
      continue;
    }

    const credentialTemplateId = await ensureCredentialTemplate(
      targetCredentialTemplates,
      credentialTemplateMap,
      platform
    );

    migratedCredentials.push({
      entity: entityId,
      credentialTemplate: credentialTemplateId || undefined,
      notes: platform || undefined,
      username: normalizeText(legacyPassword?.username) || undefined,
      secret: plainSecret ? encryptCredential(plainSecret) : "",
      createdAt: toDate(sourceEntity?.updatedAt || sourceEntity?.createdAt),
      updatedAt: toDate(sourceEntity?.updatedAt || sourceEntity?.createdAt),
    });
  }

  if (migratedCredentials.length > 0) {
    await credentialCollection.insertMany(migratedCredentials);
    counters.credentialsInserted += migratedCredentials.length;
  }
}

async function migrate() {
  assertConfigured(SOURCE_MONGO_URI, "SOURCE_MONGO_URI");
  assertConfigured(TARGET_MONGO_URI, "TARGET_MONGO_URI");

  const sourceConnection = await connectDatabase(SOURCE_MONGO_URI, "Source");
  const targetConnection = await connectDatabase(TARGET_MONGO_URI, "Target");

  try {
    const sourceDb = sourceConnection.db;
    const targetDb = targetConnection.db;

    const sourceCompanies = await sourceDb.collection("companies").find({}).toArray();
    const sourceEmployees = await sourceDb.collection("employees").find({}).toArray();

    const companyIds = new Set(sourceCompanies.map((company) => company._id.toString()));
    const employeeIds = new Set(sourceEmployees.map((employee) => employee._id.toString()));
    const collidingIds = [...companyIds].filter((id) => employeeIds.has(id));
    const collidingIdSet = new Set(collidingIds);

    if (collidingIds.length > 0) {
      console.warn(
        `Found ${collidingIds.length} overlapping company/employee ids. Employee collisions will be remapped.`
      );
    }

    const entityCollection = targetDb.collection("entities");
    const documentCollection = targetDb.collection("documents");
    const credentialCollection = targetDb.collection("credentials");
    const targetDocumentTemplates = targetDb.collection("documentTemplates");
    const targetCredentialTemplates = targetDb.collection("credentialTemplates");

    const documentTemplateMap = await loadTemplateMap(targetDocumentTemplates, "name");
    const credentialTemplateMap = await loadTemplateMap(targetCredentialTemplates, "platform");

    const counters = {
      entitiesUpserted: 0,
      companiesMigrated: 0,
      employeesMigrated: 0,
      documentsInserted: 0,
      credentialsInserted: 0,
      employeesSkippedWithoutCompany: 0,
    };

    for (const sourceCompany of sourceCompanies) {
      if (sourceCompany?.published === false) {
        continue;
      }

      const companyEntityId = sourceCompany._id;

      await migrateEntityPayload({
        entityCollection,
        sourceEntity: sourceCompany,
        entityId: companyEntityId,
        entityType: "company",
        companyRef: null,
        color: getDistinctEntityColor(counters.entitiesUpserted),
      });

      await migrateEntityDocuments({
        documentCollection,
        credentialCollection,
        targetDocumentTemplates,
        targetCredentialTemplates,
        documentTemplateMap,
        credentialTemplateMap,
        sourceEntity: sourceCompany,
        entityId: companyEntityId,
        counters,
      });

      counters.entitiesUpserted += 1;
      counters.companiesMigrated += 1;
    }

    for (const sourceEmployee of sourceEmployees) {
      if (sourceEmployee?.published === false) {
        continue;
      }

      const oldEmployeeId = sourceEmployee._id.toString();
      const linkedCompanyId = sourceEmployee?.company ? sourceEmployee.company.toString() : "";
      const isIndividual = linkedCompanyId === LEGACY_INDIVIDUAL_COMPANY_ID;
      const employeeEntityId = collidingIdSet.has(oldEmployeeId)
        ? new mongoose.Types.ObjectId()
        : sourceEmployee._id;

      const companyRef = !isIndividual && sourceEmployee?.company ? sourceEmployee.company : null;
      const entityType = isIndividual ? "individual" : "employee";

      if (!companyRef && !isIndividual) {
        counters.employeesSkippedWithoutCompany += 1;
        console.warn(
          `Skipping employee ${oldEmployeeId} because the legacy record does not reference a company.`
        );
        continue;
      }

      await migrateEntityPayload({
        entityCollection,
        sourceEntity: sourceEmployee,
        entityId: employeeEntityId,
        entityType,
        companyRef,
        color: getDistinctEntityColor(counters.entitiesUpserted),
      });

      await migrateEntityDocuments({
        documentCollection,
        credentialCollection,
        targetDocumentTemplates,
        targetCredentialTemplates,
        documentTemplateMap,
        credentialTemplateMap,
        sourceEntity: sourceEmployee,
        entityId: employeeEntityId,
        counters,
      });

      counters.entitiesUpserted += 1;
      counters.employeesMigrated += 1;
    }

    return {
      companiesScanned: sourceCompanies.length,
      employeesScanned: sourceEmployees.length,
      ...counters,
    };
  } finally {
    await sourceConnection.close();
    await targetConnection.close();
  }
}

migrate()
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  });