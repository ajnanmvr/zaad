import bcryptjs from "bcryptjs";
import { UserRepository } from "@/repositories/user.repository";
import { logUserActivity } from "@/helpers/userActivityLogger";
import { NextRequest } from "next/server";

export const UserService = {
  async listUsers(search: string | null, page: number, limit: number, showDeleted: boolean) {
    const query: any = { published: !showDeleted };
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { fullname: { $regex: search, $options: "i" } },
      ];
    }

    const total = await UserRepository.count(query);
    const users = await UserRepository.findPaginated(query, page, limit);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasMore: (page + 1) * limit < total,
      },
      showingDeleted: showDeleted,
    };
  },

  async createUser(data: { username: string; password: string; role?: string; fullname?: string }, performedById: string, request: NextRequest) {
    const { username, password, role, fullname } = data;

    if (!username || !password) {
      throw new Error("Username and password are required");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    const existingUser = await UserRepository.findOne({ username, published: true });
    if (existingUser) {
      throw new Error("Username already exists");
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    const savedUser = await UserRepository.create({
      username,
      password: hashedPassword,
      role: role || "employee",
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
  },

  async getUser(id: string) {
    return UserRepository.findById(id);
  },

  async updateUser(id: string, payload: { username?: string; fullname?: string; role?: string; password?: string }, currentUserId: string, request: NextRequest) {
    const existingUser = await UserRepository.findOne({ _id: id, published: true });
    if (!existingUser) {
      throw new Error("User not found");
    }

    const { username, fullname, role, password } = payload;

    if (id === currentUserId && role === "employee") {
      throw new Error("You cannot change your own role from partner to employee");
    }

    if (role === "employee" && existingUser.role === "partner" && id !== currentUserId) {
      throw new Error("Partners cannot downgrade other partners to employee role");
    }

    if (password && existingUser.role === "partner" && id !== currentUserId) {
      throw new Error("Partners cannot change passwords of other partners");
    }

    if (username && username !== existingUser.username) {
      const usernameExists = await UserRepository.findOne({
        username,
        published: true,
        _id: { $ne: id },
      });
      if (usernameExists) throw new Error("Username already exists");
    }

    const previousValues: any = {};
    if (username && username !== existingUser.username) previousValues.username = existingUser.username;
    if (fullname !== undefined && fullname !== existingUser.fullname) previousValues.fullname = existingUser.fullname;
    if (role && role !== existingUser.role) previousValues.role = existingUser.role;
    if (password) previousValues.passwordChanged = true;

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
        throw new Error("Password must be at least 6 characters long");
      }
      const salt = await bcryptjs.genSalt(10);
      updateData.password = await bcryptjs.hash(password, salt);
      newValues.passwordChanged = true;
    }

    const updatedUser = await UserRepository.updateById(id, updateData);

    if (Object.keys(previousValues).length > 0) {
      const action = password ? "password_change" : role && role !== existingUser.role ? "role_change" : "update";
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
  },

  async deleteUser(id: string, currentUserId: string, request: NextRequest) {
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
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string, request: NextRequest) {
    if (!currentPassword || !newPassword) {
      throw new Error("Current password and new password are required");
    }
    if (newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long");
    }

    const user = await UserRepository.findOne({ _id: userId });
    if (!user) throw new Error("User not found");

    const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, (user as any).password);
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    const isSamePassword = await bcryptjs.compare(newPassword, (user as any).password);
    if (isSamePassword) {
      throw new Error("New password must be different from current password");
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedNewPassword = await bcryptjs.hash(newPassword, salt);

    await UserRepository.updateById(userId, { password: hashedNewPassword });

    await logUserActivity({
      targetUserId: userId,
      performedById: userId,
      action: "password_change",
      details: { reason: "Self password change" },
      request,
    });

    return { message: "Password changed successfully" };
  },

  async reactivateUser(id: string, currentUserId: string, request: NextRequest) {
    const user = await UserRepository.findOne({ _id: id, published: false });
    if (!user) throw new Error("Deleted user not found");

    const existingActiveUser = await UserRepository.findOne({
      username: (user as any).username,
      published: true,
      _id: { $ne: id },
    });
    if (existingActiveUser) {
      throw new Error(`Cannot reactivate user. Username '${(user as any).username}' is already taken by an active user.`);
    }

    await UserRepository.updateById(id, { published: true, deletedAt: null });

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
  },
};