export type AppRole = string;
export type AppPermission = string;

export function hasPermission(
  permissions: AppPermission[],
  permission: AppPermission
): boolean {
  return permissions.includes(permission);
}
