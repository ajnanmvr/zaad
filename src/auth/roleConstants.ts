// Role names with special meaning. Kept free of server imports so client code can use it too.

/** Unrestricted, uneditable, not assignable through the UI/API (granted by migration only). */
export const DEVELOPER_ROLE = "developer";

/** Regular DB-backed role that holds every permission by default but can be edited/restricted. */
export const PARTNER_ROLE = "partner";

const normalize = (role?: string) => (role || "").toLowerCase().trim();

export function isDeveloperRole(role?: string) {
  return normalize(role) === DEVELOPER_ROLE;
}

/** Pre-migration role name ("superadmin" and its spelling variants). */
export function isLegacySuperAdminRole(role?: string) {
  return ["superadmin", "super_admin", "super-admin", "super admin"].includes(normalize(role));
}

/** Names that can never be created as ordinary roles. */
export function isReservedRoleName(role?: string) {
  return isDeveloperRole(role) || isLegacySuperAdminRole(role);
}

/** Roles that may use admin-only tooling (bin, stats recompute, hard record actions). */
export function isAdminRoleName(role?: string) {
  const normalized = normalize(role).replace(/[\s_-]+/g, "");
  return (
    normalized === "admin" ||
    normalized === "superadmin" ||
    normalized === DEVELOPER_ROLE ||
    normalized === PARTNER_ROLE
  );
}
