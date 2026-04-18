export const PERMISSION_GROUPS: Record<string, string[]> = {
  security: [
    "admin.access",
    "settings.read",
    "settings.write",
    "roles.manage",
  ],
  users: [
    "users.read",
    "users.create",
    "users.update",
    "users.delete",
    "users.reactivate",
  ],
  audit: [
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
  tasks: [
    "tasks.read",
    "tasks.manage",
    "tasks.complete",
    "tasks.notifications.read",
  ],
};

export const ALL_PERMISSIONS = Array.from(
  new Set(Object.values(PERMISSION_GROUPS).flat()),
);
