export type AppRole = "partner" | "employee";

export type AppPermission =
  | "admin.access"
  | "users.read"
  | "users.create"
  | "users.update"
  | "users.delete"
  | "users.reactivate"
  | "users.activity.read"
  | "entities.read"
  | "entities.write"
  | "documents.read"
  | "documents.write"
  | "payments.read"
  | "payments.write"
  | "settings.read"
  | "settings.write";

const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
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

export function getRolePermissions(role: AppRole): AppPermission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(
  role: AppRole,
  permission: AppPermission
): boolean {
  return getRolePermissions(role).includes(permission);
}
