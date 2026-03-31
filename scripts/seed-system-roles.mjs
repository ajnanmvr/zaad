import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;
const ROLE_SEED_JSON = process.env.ROLE_SEED_JSON;

if (!MONGO_URI) {
  console.error("Missing MONGO_URI environment variable");
  process.exit(1);
}

if (!ROLE_SEED_JSON) {
  console.error("Missing ROLE_SEED_JSON environment variable");
  process.exit(1);
}

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Role = mongoose.models.roles || mongoose.model("roles", roleSchema);

let rolesToSeed = [];

try {
  const parsed = JSON.parse(ROLE_SEED_JSON);
  rolesToSeed = Array.isArray(parsed) ? parsed : [];
} catch {
  console.error("ROLE_SEED_JSON must be valid JSON");
  process.exit(1);
}

if (rolesToSeed.length === 0) {
  console.error("ROLE_SEED_JSON must contain at least one role");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI, { bufferCommands: false });

  for (const role of rolesToSeed) {
    const name = String(role?.name || "").trim().toLowerCase();
    const description = String(role?.description || "");
    const permissions = Array.isArray(role?.permissions) ? role.permissions : [];
    const isSystem = role?.isSystem !== false;

    if (!name || permissions.length === 0) {
      console.error(`Invalid role seed entry: ${JSON.stringify(role)}`);
      process.exit(1);
    }

    await Role.findOneAndUpdate(
      { name },
      {
        name,
        description,
        permissions,
        isSystem,
        published: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Seeded ${rolesToSeed.length} role(s).`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Failed to seed system roles:", error);
  await mongoose.disconnect();
  process.exit(1);
});
