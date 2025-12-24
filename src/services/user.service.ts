import { UserRepository } from "@/repositories/user.repository";
import { logUserActivity } from "@/helpers/userActivityLogger";
import { NextRequest } from "next/server";
import {
  hashPassword,
  comparePassword,
  isPasswordDifferent,
  validatePassword,
} from "@/utils/password.utils";
import {
  buildQuery,
  buildPaginationMeta,
  sliceCursorData,
} from "@/utils/pagination.utils";

class UserServiceClass {
  async listUsers(
    search: string | null,
    page: number,
    limit: number,
    showDeleted: boolean
  ) {
    const query = buildQuery(!showDeleted, search, [
      "username",
      "fullname",
    ]);

    const total = await UserRepository.count(query);
    const users = await UserRepository.findPaginated(query, page, limit);

    return {
      users,
      pagination: buildPaginationMeta(page, limit, total),
      showingDeleted: showDeleted,
    };
  }

  async createUser(
    data: {
      username: string;
      password: string;
      role?: string;
      fullname?: string;
    },
    performedById: string,
    request: NextRequest
  ) {
    const { username, password, role, fullname } = data;

    // Validate inputs
    if (!username || !password) {
      throw new Error("Username and password are required");
    }

    const validation = validatePassword(password);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Check if username exists
    const existingUser = await UserRepository.findOne({
      username,
      published: true,
    });
    if (existingUser) {
      throw new Error("Username already exists");
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const savedUser = await UserRepository.create({
      username,
      password: hashedPassword,
      role: role || "employee",
      fullname: fullname || "",
    });

    // Log activity
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

  async getUser(id: string) {
    return UserRepository.findById(id);
  }

  async updateUser(
    id: string,
    payload: {
      username?: string;
      fullname?: string;
      role?: string;
      password?: string;
    },
    currentUserId: string,
    request: NextRequest
  ) {
    const existingUser = await UserRepository.findOne({
      _id: id,
      published: true,
    });
    if (!existingUser) {
      throw new Error("User not found");
    }

    const { username, fullname, role, password } = payload;

    // Role change validations
    if (id === currentUserId && role === "employee") {
      throw new Error(
        "You cannot change your own role from partner to employee"
      );
    }

    if (
      role === "employee" &&
      existingUser.role === "partner" &&
      id !== currentUserId
    ) {
      throw new Error(
        "Partners cannot downgrade other partners to employee role"
      );
    }

    if (
      password &&
      existingUser.role === "partner" &&
      id !== currentUserId
    ) {
      throw new Error("Partners cannot change passwords of other partners");
    }

    // Check username uniqueness
    if (username && username !== existingUser.username) {
      const usernameExists = await UserRepository.findOne({
        username,
        published: true,
        _id: { $ne: id },
      });
      if (usernameExists) throw new Error("Username already exists");
    }

    // Track changes
    const previousValues: any = {};
    const newValues: any = {};

    if (username && username !== existingUser.username) {
      previousValues.username = existingUser.username;
      newValues.username = username;
    }
    if (fullname !== undefined && fullname !== existingUser.fullname) {
      previousValues.fullname = existingUser.fullname;
      newValues.fullname = fullname;
    }
    if (role && role !== existingUser.role) {
      previousValues.role = existingUser.role;
      newValues.role = role;
    }

    // Prepare update data
    const updateData: any = {};
    if (username) updateData.username = username;
    if (fullname !== undefined) updateData.fullname = fullname;
    if (role) updateData.role = role;

    // Handle password change
    if (password) {
      const validation = validatePassword(password);
      if (!validation.valid) {
        throw new Error(validation.message);
      }
      updateData.password = await hashPassword(password);
      previousValues.passwordChanged = true;
      newValues.passwordChanged = true;
    }

    // Update user
    const updatedUser = await UserRepository.updateById(id, updateData);

    // Log activity
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

  async deleteUser(
    id: string,
    currentUserId: string,
    request: NextRequest
  ) {
    if (id === currentUserId) {
      throw new Error("You cannot delete your own account");
    }

    const user = await UserRepository.findOne({ _id: id, published: true });
    if (!user) throw new Error("User not found");

    await UserRepository.softDelete(id);

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

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    request: NextRequest
  ) {
    // Validate inputs
    if (!currentPassword || !newPassword) {
      throw new Error("Current password and new password are required");
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Get user
    const user = await UserRepository.findOne({ _id: userId });
    if (!user) throw new Error("User not found");

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      (user as any).password
    );
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Check if new password is different
    const isDifferent = await isPasswordDifferent(
      newPassword,
      (user as any).password
    );
    if (!isDifferent) {
      throw new Error("New password must be different from current password");
    }

    // Hash and update password
    const hashedNewPassword = await hashPassword(newPassword);
    await UserRepository.updateById(userId, { password: hashedNewPassword });

    // Log activity
    await logUserActivity({
      targetUserId: userId,
      performedById: userId,
      action: "password_change",
      details: { reason: "Self password change" },
      request,
    });

    return { message: "Password changed successfully" };
  }

  async reactivateUser(
    id: string,
    currentUserId: string,
    request: NextRequest
  ) {
    const user = await UserRepository.findOne({
      _id: id,
      published: false,
    });
    if (!user) throw new Error("Deleted user not found");

    // Check if username is already taken
    const existingActiveUser = await UserRepository.findOne({
      username: (user as any).username,
      published: true,
      _id: { $ne: id },
    });
    if (existingActiveUser) {
      throw new Error(
        `Cannot reactivate user. Username '${(user as any).username}' is already taken by an active user.`
      );
    }

    // Reactivate user
    await UserRepository.updateById(id, {
      published: true,
      deletedAt: null,
    });

    // Log activity
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
      _id: (user as any)._id,
      username: (user as any).username,
      fullname: (user as any).fullname,
      role: (user as any).role,
      createdAt: (user as any).createdAt,
    };
  }
}

export const UserService = new UserServiceClass();