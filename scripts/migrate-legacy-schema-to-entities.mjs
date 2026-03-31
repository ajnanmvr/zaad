import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import crypto from "crypto";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}

const ALGORITHM = "aes-256-gcm";

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
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function looksEncrypted(payload) {
  if (typeof payload !== "string") {
    return false;
  }
  const parts = payload.split(":");
  if (parts.length !== 3) {
    return false;
  }
  return parts.every((part) => /^[0-9a-f]+$/i.test(part) && part.length > 0);
}

function toObjectId(id) {
  if (!id) return null;
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
}

async function resolveCollection(db, preferred, fallbacks = []) {
  const names = [preferred, ...fallbacks];
  const existing = await db.listCollections({}, { nameOnly: true }).toArray();
  const existingSet = new Set(existing.map((item) => item.name));

  for (const name of names) {
    if (existingSet.has(name)) {
      return db.collection(name);
    }
  }

  return db.collection(preferred);
}

async function run() {
  loadEnvLocal();

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is missing in environment/.env.local");
  }

  await mongoose.connect(uri, { bufferCommands: false });

  const db = mongoose.connection.db;
  const legacyCompanies = db.collection("companies");
  const legacyEmployees = db.collection("employees");
  const legacyEntityPasswords = await resolveCollection(db, "entitypassword", [
    "entityPasswords",
    "entitypasswords",
  ]);

  const entities = db.collection("entities");
  const entityDocuments = db.collection("documents");
  const credentials = db.collection("credentials");

  const counters = {
    companiesScanned: 0,
    employeesScanned: 0,
    entitiesUpserted: 0,
    documentsInserted: 0,
    credentialsInserted: 0,
    legacyEntityPasswordsMigrated: 0,
    credentialsEncryptedInPlace: 0,
  };

  const companies = await legacyCompanies.find({}).toArray();
  for (const company of companies) {
    counters.companiesScanned += 1;

    const entityDoc = {
      _id: company._id,
      entityType: "company",
      name: company.name,
      licenseNo: company.licenseNo,
      companyType: company.companyType,
      emirates: company.emirates,
      phone1: company.phone1,
      phone2: company.phone2,
      email: company.email,
      transactionNo: company.transactionNo,
      isMainland: company.isMainland,
      remarks: company.remarks,
      published: company.published ?? true,
      createdAt: company.createdAt || new Date(),
      updatedAt: company.updatedAt || new Date(),
    };

    const entityRes = await entities.updateOne(
      { _id: company._id },
      { $setOnInsert: entityDoc },
      { upsert: true }
    );
    if (entityRes.upsertedCount > 0) {
      counters.entitiesUpserted += 1;
    }

    if (Array.isArray(company.documents)) {
      for (const doc of company.documents) {
        const docId = doc?._id || new mongoose.Types.ObjectId();
        const docRes = await entityDocuments.updateOne(
          { _id: docId },
          {
            $setOnInsert: {
              _id: docId,
              entity: company._id,
              name: doc?.name,
              issueDate: doc?.issueDate,
              expiryDate: doc?.expiryDate,
              attachment: doc?.attachment,
              createdAt: company.createdAt || new Date(),
              updatedAt: company.updatedAt || new Date(),
            },
          },
          { upsert: true }
        );
        if (docRes.upsertedCount > 0) {
          counters.documentsInserted += 1;
        }
      }
    }

    if (Array.isArray(company.password)) {
      for (const item of company.password) {
        const credId = item?._id || new mongoose.Types.ObjectId();
        const plainSecret = item?.password || "";
        const credRes = await credentials.updateOne(
          { _id: credId },
          {
            $setOnInsert: {
              _id: credId,
              entity: company._id,
              platform: item?.platform,
              username: item?.username,
              secret: plainSecret ? encryptCredential(plainSecret) : "",
              createdAt: company.createdAt || new Date(),
              updatedAt: company.updatedAt || new Date(),
            },
          },
          { upsert: true }
        );
        if (credRes.upsertedCount > 0) {
          counters.credentialsInserted += 1;
        }
      }
    }
  }

  const employees = await legacyEmployees.find({}).toArray();
  for (const employee of employees) {
    counters.employeesScanned += 1;

    const entityDoc = {
      _id: employee._id,
      entityType: "employee",
      name: employee.name,
      company: toObjectId(employee.company),
      isActive: employee.isActive ?? true,
      emiratesId: employee.emiratesId,
      nationality: employee.nationality,
      phone1: employee.phone1,
      phone2: employee.phone2,
      email: employee.email,
      designation: employee.designation,
      remarks: employee.remarks,
      published: employee.published ?? true,
      createdAt: employee.createdAt || new Date(),
      updatedAt: employee.updatedAt || new Date(),
    };

    const entityRes = await entities.updateOne(
      { _id: employee._id },
      { $setOnInsert: entityDoc },
      { upsert: true }
    );
    if (entityRes.upsertedCount > 0) {
      counters.entitiesUpserted += 1;
    }

    if (Array.isArray(employee.documents)) {
      for (const doc of employee.documents) {
        const docId = doc?._id || new mongoose.Types.ObjectId();
        const docRes = await entityDocuments.updateOne(
          { _id: docId },
          {
            $setOnInsert: {
              _id: docId,
              entity: employee._id,
              name: doc?.name,
              issueDate: doc?.issueDate,
              expiryDate: doc?.expiryDate,
              attachment: doc?.attachment,
              createdAt: employee.createdAt || new Date(),
              updatedAt: employee.updatedAt || new Date(),
            },
          },
          { upsert: true }
        );
        if (docRes.upsertedCount > 0) {
          counters.documentsInserted += 1;
        }
      }
    }

    if (Array.isArray(employee.password)) {
      for (const item of employee.password) {
        const credId = item?._id || new mongoose.Types.ObjectId();
        const plainSecret = item?.password || "";
        const credRes = await credentials.updateOne(
          { _id: credId },
          {
            $setOnInsert: {
              _id: credId,
              entity: employee._id,
              platform: item?.platform,
              username: item?.username,
              secret: plainSecret ? encryptCredential(plainSecret) : "",
              createdAt: employee.createdAt || new Date(),
              updatedAt: employee.updatedAt || new Date(),
            },
          },
          { upsert: true }
        );
        if (credRes.upsertedCount > 0) {
          counters.credentialsInserted += 1;
        }
      }
    }
  }

  const legacyPasswords = await legacyEntityPasswords.find({}).toArray();
  for (const oldCred of legacyPasswords) {
    const plainSecret = oldCred?.password || "";
    const res = await credentials.updateOne(
      { _id: oldCred._id },
      {
        $setOnInsert: {
          _id: oldCred._id,
          entity: toObjectId(oldCred.entity),
          platform: oldCred.platform,
          username: oldCred.username,
          secret: plainSecret ? encryptCredential(plainSecret) : "",
          createdAt: oldCred.createdAt || new Date(),
          updatedAt: oldCred.updatedAt || new Date(),
        },
      },
      { upsert: true }
    );

    if (res.upsertedCount > 0) {
      counters.legacyEntityPasswordsMigrated += 1;
    }
  }

  const existingCredentials = await credentials.find({}).toArray();
  for (const cred of existingCredentials) {
    let nextSecret = null;

    if (cred.secret && !looksEncrypted(cred.secret)) {
      nextSecret = encryptCredential(cred.secret);
    } else if (!cred.secret && cred.password) {
      nextSecret = encryptCredential(cred.password);
    }

    if (nextSecret) {
      await credentials.updateOne(
        { _id: cred._id },
        {
          $set: { secret: nextSecret, updatedAt: new Date() },
          $unset: { password: "" },
        }
      );
      counters.credentialsEncryptedInPlace += 1;
    }
  }

  console.log("Migration completed.");
  console.log(JSON.stringify(counters, null, 2));

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Migration failed:", error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
