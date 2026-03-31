import fs from "fs";
import path from "path";
import mongoose from "mongoose";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function sumEmbedded(items, field) {
  return items.reduce((sum, item) => {
    const arr = item?.[field];
    return sum + (Array.isArray(arr) ? arr.length : 0);
  }, 0);
}

async function run() {
  loadEnvLocal();
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  await mongoose.connect(process.env.MONGO_URI, { bufferCommands: false });
  const db = mongoose.connection.db;

  const companiesCol = db.collection("companies");
  const employeesCol = db.collection("employees");
  const entitiesCol = db.collection("entities");
  const docsCol = db.collection("entityDocuments");
  const credsCol = db.collection("credentials");

  const [legacyCompanies, legacyEmployees] = await Promise.all([
    companiesCol.find({}).toArray(),
    employeesCol.find({}).toArray(),
  ]);

  const legacy = {
    companies: legacyCompanies.length,
    employees: legacyEmployees.length,
    individuals: 0,
    docsInCompanies: sumEmbedded(legacyCompanies, "documents"),
    docsInEmployees: sumEmbedded(legacyEmployees, "documents"),
    credsInCompanies: sumEmbedded(legacyCompanies, "password"),
    credsInEmployees: sumEmbedded(legacyEmployees, "password"),
  };

  const [entityTypeCounts, totalDocs, totalCreds, credsWithSecret, credsWithLegacyPassword] =
    await Promise.all([
      entitiesCol
        .aggregate([
          { $group: { _id: "$entityType", count: { $sum: 1 } } },
          { $project: { _id: 0, entityType: "$_id", count: 1 } },
        ])
        .toArray(),
      docsCol.countDocuments({}),
      credsCol.countDocuments({}),
      credsCol.countDocuments({ secret: { $exists: true, $ne: "" } }),
      credsCol.countDocuments({ password: { $exists: true, $ne: "" } }),
    ]);

  const entityMap = Object.fromEntries(
    entityTypeCounts.map((x) => [x.entityType || "unknown", x.count])
  );

  const migrated = {
    companies: entityMap.company || 0,
    employees: entityMap.employee || 0,
    individuals: entityMap.individual || 0,
    documents: totalDocs,
    credentials: totalCreds,
    credentialsEncrypted: credsWithSecret,
    credentialsLegacyPasswordField: credsWithLegacyPassword,
  };

  const report = {
    legacy,
    migrated,
    deltas: {
      companies: migrated.companies - legacy.companies,
      employees: migrated.employees - legacy.employees,
      individuals: migrated.individuals - legacy.individuals,
      documents:
        migrated.documents - (legacy.docsInCompanies + legacy.docsInEmployees),
      credentials:
        migrated.credentials - (legacy.credsInCompanies + legacy.credsInEmployees),
    },
  };

  console.log(JSON.stringify(report, null, 2));

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Post-check failed:", error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
