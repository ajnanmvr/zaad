import Role from "@/models/roles";
import { redis } from "@/db/redis";
import { ServiceError } from "./serviceError";
import { NextRequest } from "next/server";
import { logUserActivity } from "@/helpers/userActivityLogger";
import { ALL_PERMISSIONS } from "@/auth/permissionCatalog";
import { expandPermissions } from "@/auth/permissions";
import {
  DEVELOPER_ROLE,
  PARTNER_ROLE,
  isDeveloperRole,
  isLegacySuperAdminRole,
  isReservedRoleName,
} from "@/auth/roleConstants";
import User from "@/models/users";

const CACHE_TTL_SECONDS = 5 * 60;

function getRoleCacheKey(roleName: string) {
  return `role-permissions:${roleName.toLowerCase()}`;
}

export async function getPermissionsForRole(roleName: string): Promise<string[]> {
  const normalizedRole = (roleName || "").toLowerCase();
  if (!normalizedRole) {
    return [];
  }

  // Developer is unrestricted by design. The legacy "superadmin" spellings keep full access only
  // until migrateSuperAdminToDeveloperAndPartner has run, so nobody is locked out mid-rollout.
  if (isDeveloperRole(normalizedRole) || isLegacySuperAdminRole(normalizedRole)) {
    return expandPermissions(ALL_PERMISSIONS);
  }

  const cacheKey = getRoleCacheKey(normalizedRole);

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return expandPermissions(JSON.parse(cached));
    }
  } catch {
    // fall back to DB/defaults
  }

  const role = await Role.findOne({ name: normalizedRole, published: true }).select(
    "permissions"
  );

  const permissions = role?.permissions || [];
  const expandedPermissions = expandPermissions(permissions);

  try {
    await redis.set(cacheKey, JSON.stringify(permissions), {
      EX: CACHE_TTL_SECONDS,
    });
  } catch {
    // ignore cache failures
  }

  return expandedPermissions;
}

export async function invalidateRolePermissionCache(roleName: string) {
  const normalizedRole = (roleName || "").toLowerCase();
  if (!normalizedRole) {
    return;
  }

  try {
    await redis.del(getRoleCacheKey(normalizedRole));
  } catch {
    // ignore cache failures
  }
}

export async function listRoles() {
  const roles = await Role.find({ published: true })
    .select("name description permissions isSystem")
    .sort({ name: 1 })
    .lean();

  // The developer role is always a locked system role, whatever the stored flag says.
  return roles.map((role: any) => (isDeveloperRole(role.name) ? { ...role, isSystem: true } : role));
}

export async function roleExists(roleName: string) {
  const normalizedRole = (roleName || "").trim().toLowerCase();
  if (!normalizedRole) {
    return false;
  }

  const role = await Role.findOne({ name: normalizedRole, published: true }).select("_id");
  return Boolean(role);
}

export async function createRole(input: {
  name: string;
  description?: string;
  permissions?: string[];
}, audit?: { performedById: string; request?: NextRequest }) {
  const name = (input.name || "").trim().toLowerCase();
  if (!name) {
    throw new ServiceError("Role name is required", 400);
  }

  if (isReservedRoleName(name)) {
    throw new ServiceError(`"${name}" is a reserved role name`, 400);
  }

  const exists = await Role.findOne({ name, published: true });
  if (exists) {
    throw new ServiceError("Role already exists", 400);
  }

  const role = await Role.create({
    name,
    description: input.description || "",
    permissions: Array.isArray(input.permissions) ? input.permissions : [],
    isSystem: false,
    published: true,
  });

  await invalidateRolePermissionCache(name);

  if (audit?.performedById) {
    await logUserActivity({
      targetUserId: audit.performedById,
      performedById: audit.performedById,
      action: "create",
      details: {
        entityType: "role",
        roleName: role.name,
      },
      newValues: {
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      },
      request: audit.request,
    });
  }

  return role;
}

export async function updateRole(
  roleName: string,
  input: { description?: string; permissions?: string[] },
  audit?: { performedById: string; request?: NextRequest }
) {
  const normalizedRole = (roleName || "").trim().toLowerCase();
  if (!normalizedRole) {
    throw new ServiceError("Role name is required", 400);
  }

  if (isDeveloperRole(normalizedRole)) {
    throw new ServiceError("The developer role cannot be modified", 403);
  }

  const existing = await Role.findOne({ name: normalizedRole, published: true });

  if (!existing) {
    throw new ServiceError("Role not found", 404);
  }

  if (existing?.isSystem) {
    throw new ServiceError("System roles cannot be modified", 403);
  }

  const update: Record<string, unknown> = {};
  if (input.description !== undefined) {
    update.description = input.description;
  }
  if (input.permissions !== undefined) {
    update.permissions = input.permissions;
  }

  const role = await Role.findOneAndUpdate(
    { name: normalizedRole, published: true },
    update,
    { new: true }
  );

  if (!role) {
    throw new ServiceError("Role not found", 404);
  }

  await invalidateRolePermissionCache(normalizedRole);

  if (audit?.performedById) {
    await logUserActivity({
      targetUserId: audit.performedById,
      performedById: audit.performedById,
      action: "update",
      details: {
        entityType: "role",
        roleName: role.name,
      },
      previousValues: {
        description: existing.description,
        permissions: existing.permissions,
      },
      newValues: {
        description: role.description,
        permissions: role.permissions,
      },
      request: audit.request,
    });
  }

  return role;
}

export async function deleteRole(
  roleName: string,
  audit?: { performedById: string; request?: NextRequest }
) {
  const normalizedRole = (roleName || "").trim().toLowerCase();
  if (isDeveloperRole(normalizedRole)) {
    throw new ServiceError("The developer role cannot be deleted", 403);
  }

  const role = await Role.findOne({ name: normalizedRole, published: true });

  if (!role) {
    throw new ServiceError("Role not found", 404);
  }

  if (role.isSystem) {
    throw new ServiceError("System roles cannot be deleted", 403);
  }

  await Role.findByIdAndUpdate(role._id, { published: false });
  await invalidateRolePermissionCache(normalizedRole);

  if (audit?.performedById) {
    await logUserActivity({
      targetUserId: audit.performedById,
      performedById: audit.performedById,
      action: "delete",
      details: {
        entityType: "role",
        roleName: role.name,
      },
      previousValues: {
        description: role.description,
        permissions: role.permissions,
        published: true,
      },
      newValues: {
        published: false,
      },
      request: audit.request,
    });
  }
}

const LEGACY_SUPERADMIN_REGEX = /^super[s_-]?admin$/i;

/**
 * One-off, idempotent rollout of the developer/partner split:
 *  - creates the locked "developer" role and the editable "partner" role (all permissions),
 *  - moves `developerUsername` to developer and every other legacy superadmin user to partner,
 *  - retires the legacy superadmin role document and clears permission caches.
 */
export async function migrateSuperAdminToDeveloperAndPartner(developerUsername: string) {
  const username = (developerUsername || "").trim();
  if (!username) {
    throw new ServiceError("developerUsername is required", 400);
  }

  const developerUser = await User.findOne({ username, published: true }).select("_id username role");
  if (!developerUser) {
    throw new ServiceError(`User "${username}" not found`, 404);
  }

  await Role.findOneAndUpdate(
    { name: DEVELOPER_ROLE },
    {
      $set: {
        description: "Unrestricted system role for the platform developer. Cannot be edited or reassigned.",
        isSystem: true,
        published: true,
      },
      $setOnInsert: { permissions: [] },
    },
    { upsert: true }
  );

  const partnerExisting = await Role.findOne({ name: PARTNER_ROLE });
  if (!partnerExisting) {
    await Role.create({
      name: PARTNER_ROLE,
      description: "Full access by default. Can be edited and restricted.",
      permissions: ALL_PERMISSIONS,
      isSystem: false,
      published: true,
    });
  } else if (!partnerExisting.published) {
    await Role.updateOne({ _id: partnerExisting._id }, { published: true });
  }

  const legacyUsers = await User.find({ role: LEGACY_SUPERADMIN_REGEX }).select("_id username role");
  const movedToPartner: string[] = [];

  for (const legacyUser of legacyUsers) {
    if (String(legacyUser._id) === String(developerUser._id)) continue;
    await User.updateOne({ _id: legacyUser._id }, { role: PARTNER_ROLE, $inc: { roleVersion: 1 } });
    movedToPartner.push(legacyUser.username);
  }

  let developerChanged = false;
  if (developerUser.role !== DEVELOPER_ROLE) {
    await User.updateOne({ _id: developerUser._id }, { role: DEVELOPER_ROLE, $inc: { roleVersion: 1 } });
    developerChanged = true;
  }

  await Role.updateMany({ name: LEGACY_SUPERADMIN_REGEX }, { published: false });

  await Promise.all(
    [DEVELOPER_ROLE, PARTNER_ROLE, "superadmin", "super_admin", "super-admin", "super admin"].map(
      invalidateRolePermissionCache
    )
  );

  return {
    developer: { username: developerUser.username, changed: developerChanged },
    movedToPartner,
  };
}
