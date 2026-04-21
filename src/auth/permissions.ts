export type AppRole = string;
export type AppPermission = string;

const PERMISSION_IMPLICATIONS: Record<AppPermission, AppPermission[]> = {
  "settings.write": ["settings.read"],
  "entities.write": ["entities.read"],
  "documents.write": ["documents.read"],
  "tasks.manage": ["tasks.read", "tasks.complete", "tasks.notifications.read"],
  "tasks.complete": ["tasks.read"],

  // Broad finance permissions imply detailed user-view permissions.
  "payments.read": [
    "payments.view.transactions",
    "payments.view.records-summary",
    "payments.view.office-records",
    "payments.view.self-transfers",
    "payments.view.liability-records",
    "payments.view.credit-debit-lists",
    "payments.view.invoices",
    "payments.view.monthly-stats",
    "payments.view.finance-summary-page",
  ],
  "payments.write": [
    "payments.read",
    "payments.create.transactions",
    "payments.update.transactions",
    "payments.delete.transactions",
    "payments.manage.self-transfers",
    "payments.manage.recompute-monthly-stats",
    "payments.manage.particular-suggestions",
  ],
};

function collectImpliedPermissions(
  permission: AppPermission,
  visited: Set<AppPermission>,
): Set<AppPermission> {
  if (visited.has(permission)) {
    return visited;
  }

  visited.add(permission);
  const implied = PERMISSION_IMPLICATIONS[permission] || [];
  for (const item of implied) {
    collectImpliedPermissions(item, visited);
  }

  return visited;
}

export function expandPermissions(
  permissions: AppPermission[],
): AppPermission[] {
  const expanded = new Set<AppPermission>();

  for (const permission of permissions || []) {
    const implied = collectImpliedPermissions(permission, new Set<AppPermission>());
    implied.forEach((item) => expanded.add(item));
  }

  return Array.from(expanded);
}

export function hasPermission(
  permissions: AppPermission[],
  permission: AppPermission
): boolean {
  if (!Array.isArray(permissions) || !permission) {
    return false;
  }

  if (permissions.includes("admin.access")) {
    return true;
  }

  if (permissions.includes(permission)) {
    return true;
  }

  return permissions.some((granted) => {
    const implied = collectImpliedPermissions(granted, new Set<AppPermission>());
    return implied.has(permission);
  });
}
