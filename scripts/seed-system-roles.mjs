import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Missing MONGO_URI environment variable");
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

const SYSTEM_ROLES = {
  partner: {
    description: "System administrator role",
    permissions: [
      "admin.access",
      "roles.manage",
      "users.read",
      "users.create",
      "users.update",
      "users.delete",
      "users.reactivate",
      "users.activity.read",
      "entities.read",
      "entities.write",
      "documents.read",
      "documents.write",
      "payments.read",
      "payments.write",
      "settings.read",
      "settings.write",
    ],
  },
  employee: {
    description: "Default standard user role",
    permissions: [
      "entities.read",
      "entities.write",
      "documents.read",
      "documents.write",
    ],
  },
};

async function run() {
  await mongoose.connect(MONGO_URI, { bufferCommands: false });

  for (const [name, role] of Object.entries(SYSTEM_ROLES)) {
    await Role.findOneAndUpdate(
      { name },
      {
        name,
        description: role.description,
        permissions: role.permissions,
        isSystem: true,
        published: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Seeded ${Object.keys(SYSTEM_ROLES).length} system roles.`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Failed to seed system roles:", error);
  await mongoose.disconnect();
  process.exit(1);
});
