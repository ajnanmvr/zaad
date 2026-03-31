import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Missing MONGO_URI environment variable");
  process.exit(1);
}

const entityDocumentSchema = new mongoose.Schema(
  {
    category: String,
    name: String,
  },
  { timestamps: true, collection: "documents" }
);

const entityCredentialSchema = new mongoose.Schema(
  {
    category: String,
    platform: String,
  },
  { timestamps: true, collection: "credentials" }
);

const documentTemplateSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    published: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "documentTemplates" }
);

documentTemplateSchema.index({ category: 1, name: 1 }, { unique: true });

const credentialTemplateSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, trim: true },
    platform: { type: String, required: true, trim: true },
    published: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "credentialTemplates" }
);

credentialTemplateSchema.index({ category: 1, platform: 1 }, { unique: true });

const EntityDocument =
  mongoose.models.documents || mongoose.model("documents", entityDocumentSchema);
const EntityCredential =
  mongoose.models.credentials || mongoose.model("credentials", entityCredentialSchema);
const DocumentTemplate =
  mongoose.models.documentTemplates ||
  mongoose.model("documentTemplates", documentTemplateSchema);
const CredentialTemplate =
  mongoose.models.credentialTemplates ||
  mongoose.model("credentialTemplates", credentialTemplateSchema);

function normalize(value) {
  return String(value || "").trim();
}

async function run() {
  await mongoose.connect(MONGO_URI, { bufferCommands: false });

  const documentRows = await EntityDocument.aggregate([
    {
      $project: {
        category: { $trim: { input: { $ifNull: ["$category", ""] } } },
        name: { $trim: { input: { $ifNull: ["$name", ""] } } },
      },
    },
    {
      $match: {
        category: { $ne: "" },
        name: { $ne: "" },
      },
    },
    {
      $group: {
        _id: {
          category: "$category",
          name: "$name",
        },
      },
    },
  ]);

  const credentialRows = await EntityCredential.aggregate([
    {
      $project: {
        category: { $trim: { input: { $ifNull: ["$category", ""] } } },
        platform: { $trim: { input: { $ifNull: ["$platform", ""] } } },
      },
    },
    {
      $match: {
        category: { $ne: "" },
        platform: { $ne: "" },
      },
    },
    {
      $group: {
        _id: {
          category: "$category",
          platform: "$platform",
        },
      },
    },
  ]);

  let documentUpserts = 0;
  for (const row of documentRows) {
    const category = normalize(row?._id?.category);
    const name = normalize(row?._id?.name);
    if (!category || !name) continue;

    await DocumentTemplate.findOneAndUpdate(
      { category, name },
      { category, name, published: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    documentUpserts += 1;
  }

  let credentialUpserts = 0;
  for (const row of credentialRows) {
    const category = normalize(row?._id?.category);
    const platform = normalize(row?._id?.platform);
    if (!category || !platform) continue;

    await CredentialTemplate.findOneAndUpdate(
      { category, platform },
      { category, platform, published: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    credentialUpserts += 1;
  }

  console.log(`Upserted ${documentUpserts} document template(s).`);
  console.log(`Upserted ${credentialUpserts} credential template(s).`);

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Failed to migrate category templates:", error);
  await mongoose.disconnect();
  process.exit(1);
});
