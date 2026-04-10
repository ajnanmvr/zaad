import bcryptjs from "bcryptjs";
import { logUserActivity, getUserActivityHistory } from "@/helpers/userActivityLogger";
import { NextRequest } from "next/server";
import { ServiceError } from "./serviceError";
import { getPermissionsForRole, roleExists } from "./roleService";
import {
  buildUserListQuery,
  countUsers,
  createUser as createUserRecord,
  findActiveUserById,
  findActiveUserByUsername,
  findActiveUserByUsernameExcludingId,
  findDeletedUserById,
  findUserById,
  findUsers,
  getUserSort,
  reactivateUserById,
  softDeleteUserById,
  updateUserById,
} from "@/repositories/userRepository";

type TListUsersInput = {
  pageNumber: number;
  limit: number;
  search: string;
  showDeleted: boolean;
  role?: string;
  sortBy?: "newest" | "oldest" | "username-asc" | "username-desc" | "fullname-asc" | "fullname-desc";
};

export async function listUsers(input: TListUsersInput) {
  const { pageNumber, limit, search, showDeleted, role, sortBy = "newest" } = input;

  const query = buildUserListQuery({ search, showDeleted, role });
  const sort = getUserSort(sortBy);

  const total = await countUsers(query);

  const users = await findUsers(query, sort, pageNumber * limit, limit);

  return {
    users,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
      hasMore: (pageNumber + 1) * limit < total,
    },
    showingDeleted: showDeleted,
  };
}

type TCreateUserInput = {
  username?: string;
  password?: string;
  role?: string;
  fullname?: string;
  performedById: string;
  request: NextRequest;
};

export async function createUser(input: TCreateUserInput) {
  const { username, password, role, fullname, performedById, request } = input;

  if (!username || !password || !role) {
    throw new ServiceError("Username, password and role are required", 400);
  }

  if (!(await roleExists(role))) {
    throw new ServiceError("Invalid role selected", 400);
  }

  if (password.length < 6) {
    throw new ServiceError("Password must be at least 6 characters long", 400);
  }

  const existingUser = await findActiveUserByUsername(username);
  if (existingUser) {
    throw new ServiceError("Username already exists", 400);
  }

  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);

  const savedUser = await createUserRecord({
    username,
    password: hashedPassword,
    role,
    fullname: fullname || "",
  });

  await logUserActivity({
    targetUserId: savedUser._id.toString(),
    performedById,
    action: "create",
    newValues: {
      username: savedUser.username,
      role: savedUser.role,
      fullname: savedUser.fullname,
    },
    request,
  });

  return {
    _id: savedUser._id,
    username: savedUser.username,
    fullname: savedUser.fullname,
    role: savedUser.role,
    createdAt: savedUser.createdAt,
  };
}

export async function getUserById(id: string) {
  const user = await findUserById(id);

  if (!user) {
    throw new ServiceError("User not found", 404);
  }

  return user;
}

type TUpdateUserInput = {
  id: string;
  currentUserId: string;
  username?: string;
  fullname?: string;
  role?: string;
  password?: string;
  request: NextRequest;
};

export async function updateUser(input: TUpdateUserInput) {
  const { id, currentUserId, username, fullname, role, password, request } = input;

  const existingUser = await findActiveUserById(id);
  if (!existingUser) {
    throw new ServiceError("User not found", 404);
  }

  const existingUserPermissions = await getPermissionsForRole(existingUser.role);
  const isExistingUserAdmin = existingUserPermissions.includes("admin.access");

  let isTargetRoleAdmin = false;
  if (role) {
    if (!(await roleExists(role))) {
      throw new ServiceError("Invalid role selected", 400);
    }

    const targetRolePermissions = await getPermissionsForRole(role);
    isTargetRoleAdmin = targetRolePermissions.includes("admin.access");
  }

  if (id === currentUserId && role && isExistingUserAdmin && !isTargetRoleAdmin) {
    throw new ServiceError(
      "You cannot remove your own admin access",
      400
    );
  }

  if (role && isExistingUserAdmin && !isTargetRoleAdmin && id !== currentUserId) {
    throw new ServiceError(
      "Admin users cannot downgrade other admin users",
      403
    );
  }

  if (password && isExistingUserAdmin && id !== currentUserId) {
    throw new ServiceError(
      "Admin users cannot change passwords of other admin users",
      403
    );
  }

  if (username && username !== existingUser.username) {
    const usernameExists = await findActiveUserByUsernameExcludingId(username, id);

    if (usernameExists) {
      throw new ServiceError("Username already exists", 400);
    }
  }

  const previousValues: any = {};
  if (username && username !== existingUser.username) {
    previousValues.username = existingUser.username;
  }
  if (fullname !== undefined && fullname !== existingUser.fullname) {
    previousValues.fullname = existingUser.fullname;
  }
  if (role && role !== existingUser.role) {
    previousValues.role = existingUser.role;
  }
  if (password) {
    previousValues.passwordChanged = true;
  }

  const updateData: any = {};
  const newValues: any = {};

  if (username) {
    updateData.username = username;
    newValues.username = username;
  }
  if (fullname !== undefined) {
    updateData.fullname = fullname;
    newValues.fullname = fullname;
  }
  if (role) {
    updateData.role = role;
    newValues.role = role;
  }

  if (password) {
    if (password.length < 6) {
      throw new ServiceError("Password must be at least 6 characters long", 400);
    }

    const salt = await bcryptjs.genSalt(10);
    updateData.password = await bcryptjs.hash(password, salt);
    newValues.passwordChanged = true;
  }

  const updatedUser = await updateUserById(id, updateData);

  if (Object.keys(previousValues).length > 0) {
    const action = password
      ? "password_change"
      : role && role !== existingUser.role
        ? "role_change"
        : "update";

    await logUserActivity({
      targetUserId: id,
      performedById: currentUserId,
      action,
      previousValues,
      newValues,
      request,
    });
  }

  return updatedUser;
}

type TSoftDeleteUserInput = {
  id: string;
  currentUserId: string;
  request: NextRequest;
};

export async function softDeleteUser(input: TSoftDeleteUserInput) {
  const { id, currentUserId, request } = input;

  if (id === currentUserId) {
    throw new ServiceError("You cannot delete your own account", 400);
  }

  const user = await findActiveUserById(id);
  if (!user) {
    throw new ServiceError("User not found", 404);
  }

  await softDeleteUserById(id);

  await logUserActivity({
    targetUserId: id,
    performedById: currentUserId,
    action: "delete",
    details: { reason: "User soft deleted" },
    previousValues: { published: true },
    newValues: { published: false },
    request,
  });
}

type TReactivateUserInput = {
  id: string;
  currentUserId: string;
  request: NextRequest;
};

export async function reactivateUser(input: TReactivateUserInput) {
  const { id, currentUserId, request } = input;

  const user = await findDeletedUserById(id);

  if (!user) {
    throw new ServiceError("Deleted user not found", 404);
  }

  const existingActiveUser = await findActiveUserByUsernameExcludingId(user.username, id);

  if (existingActiveUser) {
    throw new ServiceError(
      `Cannot reactivate user. Username '${user.username}' is already taken by an active user.`,
      400
    );
  }

  await reactivateUserById(id);

  await logUserActivity({
    targetUserId: id,
    performedById: currentUserId,
    action: "reactivate",
    details: { reason: "User reactivated from deleted state" },
    previousValues: { published: false },
    newValues: { published: true },
    request,
  });

  return {
    _id: user._id,
    username: user.username,
    fullname: user.fullname,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function listUserActivityHistory(
  userId: string,
  page: number,
  limit: number
) {
  return getUserActivityHistory(userId, page, limit);
}
