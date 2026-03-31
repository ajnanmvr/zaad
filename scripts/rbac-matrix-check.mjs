import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.log("RBAC matrix check skipped: MONGO_URI not set (DB-driven role model).");
  process.exit(0);
}

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    permissions: { type: [String], default: [] },
    published: { type: Boolean, default: true },
  },
  { strict: false }
);

const Role = mongoose.models.roles || mongoose.model("roles", roleSchema);

async function run() {
  await mongoose.connect(MONGO_URI, { bufferCommands: false });

  const roles = await Role.find({ published: true }).select("name permissions");
  const failures = [];

  if (roles.length === 0) {
    failures.push("No published roles found in database");
  }

  for (const role of roles) {
    const roleName = String(role.name || "").trim();
    const permissions = Array.isArray(role.permissions) ? role.permissions : [];
    const uniquePermissions = new Set(permissions);

    if (!roleName) {
      failures.push("Role with empty name found");
    }

    if (permissions.length === 0) {
      failures.push(`${roleName || "<unnamed role>"} has no permissions`);
    }

    if (uniquePermissions.size !== permissions.length) {
      failures.push(`${roleName || "<unnamed role>"} has duplicate permissions`);
    }
  }

  await mongoose.disconnect();

  if (failures.length > 0) {
    console.error("RBAC matrix check failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
    process.exit(1);
  }

  console.log(`RBAC matrix check passed for ${roles.length} role(s).`);
}

run().catch(async (error) => {
  console.error("RBAC matrix check failed:", error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
