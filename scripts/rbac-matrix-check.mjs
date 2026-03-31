const rolePermissions = {
  partner: [
    "admin.access",
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
  employee: [
    "entities.read",
    "entities.write",
    "documents.read",
    "documents.write",
  ],
};

const requiredByRole = {
  partner: [
    "users.read",
    "users.create",
    "users.update",
    "users.delete",
    "users.reactivate",
    "users.activity.read",
    "payments.read",
    "payments.write",
  ],
  employee: ["entities.read", "documents.read"],
};

function run() {
  const failures = [];

  for (const role of Object.keys(requiredByRole)) {
    const granted = new Set(rolePermissions[role] || []);
    for (const permission of requiredByRole[role]) {
      if (!granted.has(permission)) {
        failures.push(`${role} missing ${permission}`);
      }
    }
  }

  if (failures.length > 0) {
    console.error("RBAC matrix check failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
    process.exit(1);
  }

  console.log("RBAC matrix check passed.");
}

run();
