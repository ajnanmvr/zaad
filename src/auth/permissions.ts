export type AppRole = string;
export type AppPermission = string;

const PERMISSION_IMPLICATIONS: Record<AppPermission, AppPermission[]> = {
  "payments.admin": ["payments.write"],
  "settings.write": [
    "settings.read",
    "settings.manage.roles",
    "settings.manage.permissions",
    "settings.manage.document-types",
    "settings.manage.credential-platforms",
    "settings.manage.office-categories",
    "settings.manage.payment-methods",
    "settings.manage.payment-statuses",
    "settings.manage.particular-suggestions",
  ],
  "entities.write": [
    "entities.read",
    "settings.manage.document-types",
    "settings.manage.credential-platforms",
  ],
  "documents.write": ["documents.read"],
  "tasks.read": ["tasks.view.my", "tasks.view.detail", "tasks.calendar.view", "tasks.links.suggest"],
  "tasks.manage": [
    "tasks.read",
    "tasks.view.all",
    "tasks.create",
    "tasks.assign",
    "tasks.update",
    "tasks.delete",
    "tasks.export",
    "tasks.complete",
    "tasks.notifications.read",
    "tasks.calendar.view",
    "tasks.links.suggest",
  ],
  "tasks.view.all": ["tasks.view.my", "tasks.view.detail"],
  "tasks.complete": ["tasks.view.my", "tasks.view.detail"],
  "tasks.update": ["tasks.view.detail"],
  "tasks.assign": ["tasks.view.all"],

  // Broad finance permissions imply detailed user-view permissions.
  "payments.read": [
    "dashboard.view.business-pulse",
    "payments.view.transactions",
    "payments.view.records-summary",
    "payments.view.office-records",
    "payments.view.self-transfers",
    "payments.view.liability-records",
    "payments.view.credit-debit-lists",
    "payments.view.invoices",
    "payments.view.monthly-stats",
    "payments.view.finance-summary-page",
    "payments.view.reports",
    "payments.view.finance",
  ],
  "payments.write": [
    "payments.read",
    "payments.create.transactions",
    "payments.update.transactions",
    "payments.delete.transactions",
    "payments.create.invoices",
    "payments.update.invoices",
    "payments.delete.invoices",
    "payments.manage.self-transfers",
    "payments.manage.recompute-monthly-stats",
    "payments.manage.particular-suggestions",
    "settings.manage.office-categories",
    "settings.manage.payment-methods",
    "settings.manage.payment-statuses",
    "settings.manage.particular-suggestions",
  ],
  "settings.read": ["settings.manage.roles", "settings.manage.permissions"],
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
