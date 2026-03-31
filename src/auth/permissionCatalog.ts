export const PERMISSION_GROUPS: Record<string, string[]> = {
  administration: [
    "admin.access",
    "roles.manage",
    "settings.read",
    "settings.write",
  ],
  users: [
    "users.read",
    "users.create",
    "users.update",
    "users.delete",
    "users.reactivate",
    "users.activity.read",
  ],
  entities: [
    "entities.read",
    "entities.write",
  ],
  documents: [
    "documents.read",
    "documents.write",
  ],
  payments: [
    "payments.read",
    "payments.write",
  ],
};

export const ALL_PERMISSIONS = Object.values(PERMISSION_GROUPS).flat();
