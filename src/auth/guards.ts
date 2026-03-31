import User from "@/models/users";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { NextRequest } from "next/server";
import {
  AppPermission,
  AppRole,
  getRolePermissions,
  hasPermission,
} from "./permissions";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export type AuthPrincipal = {
  userId: string;
  username: string;
  role: AppRole;
  permissions: AppPermission[];
};

const principalCache = new WeakMap<NextRequest, Promise<AuthPrincipal>>();

async function buildPrincipal(request: NextRequest): Promise<AuthPrincipal> {
  let userId = "";

  try {
    userId = await getUserFromCookie(request);
  } catch {
    throw new AuthError("Invalid or missing auth token", 401);
  }

  if (!userId) {
    throw new AuthError("Authentication required", 401);
  }

  const user = await User.findOne({ _id: userId, published: true }).select(
    "username role"
  );

  if (!user) {
    throw new AuthError("User not found or not published", 401);
  }

  const role = user.role as AppRole;
  const permissions = getRolePermissions(role);

  return {
    userId: user._id.toString(),
    username: user.username,
    role,
    permissions,
  };
}

export async function getAuthPrincipal(
  request: NextRequest
): Promise<AuthPrincipal> {
  if (!principalCache.has(request)) {
    principalCache.set(request, buildPrincipal(request));
  }

  return principalCache.get(request)!;
}

export async function requireAuth(request: NextRequest): Promise<AuthPrincipal> {
  return getAuthPrincipal(request);
}

export async function requireRole(
  request: NextRequest,
  role: AppRole
): Promise<AuthPrincipal> {
  const principal = await requireAuth(request);

  if (principal.role !== role) {
    throw new AuthError(`Required role: ${role}`, 403);
  }

  return principal;
}

export async function requirePermission(
  request: NextRequest,
  permission: AppPermission
): Promise<AuthPrincipal> {
  const principal = await requireAuth(request);

  if (!hasPermission(principal.role, permission)) {
    throw new AuthError(`Missing permission: ${permission}`, 403);
  }

  return principal;
}

export async function requireAnyPermission(
  request: NextRequest,
  permissions: AppPermission[]
): Promise<AuthPrincipal> {
  const principal = await requireAuth(request);
  const isAllowed = permissions.some((permission) =>
    hasPermission(principal.role, permission)
  );

  if (!isAllowed) {
    throw new AuthError("Missing required permissions", 403);
  }

  return principal;
}
