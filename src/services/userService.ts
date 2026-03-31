import User from "@/models/users";
import bcryptjs from "bcryptjs";
import { logUserActivity, getUserActivityHistory } from "@/helpers/userActivityLogger";
import { NextRequest } from "next/server";
import { ServiceError } from "./serviceError";
import { getPermissionsForRole, roleExists } from "./roleService";

type TListUsersInput = {
  pageNumber: number;
  limit: number;
  search: string;
  showDeleted: boolean;
};

export async function listUsers(input: TListUsersInput) {
  const { pageNumber, limit, search, showDeleted } = input;

  const query: any = { published: !showDeleted };
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: "i" } },
      { fullname: { $regex: search, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(query);

  const users = await User.find(query)
    .select("username fullname role createdAt updatedAt deletedAt")
    .sort({ createdAt: -1 })
    .skip(pageNumber * limit)
    .limit(limit);

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

  const existingUser = await User.findOne({ username, published: true });
  if (existingUser) {
    throw new ServiceError("Username already exists", 400);
  }

  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);

  const newUser = new User({
    username,
    password: hashedPassword,
    role,
    fullname: fullname || "",
  });

  const savedUser = await newUser.save();

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
  const user = await User.findById(id).select(
    "username fullname role createdAt updatedAt published deletedAt"
  );

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

  const existingUser = await User.findOne({ _id: id, published: true });
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
    const usernameExists = await User.findOne({
      username,
      published: true,
      _id: { $ne: id },
    });

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

  const updatedUser = await User.findByIdAndUpdate(id, updateData, {
    new: true,
  }).select("username fullname role createdAt updatedAt");

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

  const user = await User.findOne({ _id: id, published: true });
  if (!user) {
    throw new ServiceError("User not found", 404);
  }

  await User.findByIdAndUpdate(id, {
    published: false,
    deletedAt: new Date(),
  });

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

  const user = await User.findOne({ _id: id, published: false }).select(
    "username fullname role createdAt"
  );

  if (!user) {
    throw new ServiceError("Deleted user not found", 404);
  }

  const existingActiveUser = await User.findOne({
    username: user.username,
    published: true,
    _id: { $ne: id },
  });

  if (existingActiveUser) {
    throw new ServiceError(
      `Cannot reactivate user. Username '${user.username}' is already taken by an active user.`,
      400
    );
  }

  await User.findByIdAndUpdate(id, {
    published: true,
    deletedAt: null,
  });

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
