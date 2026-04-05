import Role from "@/models/roles";
import { redis } from "@/db/redis";
import { ServiceError } from "./serviceError";
import { NextRequest } from "next/server";
import { logUserActivity } from "@/helpers/userActivityLogger";
import { ALL_PERMISSIONS } from "@/auth/permissionCatalog";

const CACHE_TTL_SECONDS = 5 * 60;

function getRoleCacheKey(roleName: string) {
  return `role-permissions:${roleName.toLowerCase()}`;
}

export async function getPermissionsForRole(roleName: string): Promise<string[]> {
  const normalizedRole = (roleName || "").toLowerCase();
  if (!normalizedRole) {
    return [];
  }

  if (["superadmin", "super_admin", "super-admin", "super admin"].includes(normalizedRole)) {
    return ALL_PERMISSIONS;
  }

  const cacheKey = getRoleCacheKey(normalizedRole);

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // fall back to DB/defaults
  }

  const role = await Role.findOne({ name: normalizedRole, published: true }).select(
    "permissions"
  );

  const permissions = role?.permissions || [];

  try {
    await redis.set(cacheKey, JSON.stringify(permissions), {
      EX: CACHE_TTL_SECONDS,
    });
  } catch {
    // ignore cache failures
  }

  return permissions;
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
  return Role.find({ published: true })
    .select("name description permissions isSystem")
    .sort({ name: 1 });
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
