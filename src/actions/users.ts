"use server";

import "server-only";

import connect from "@/db/mongo";
import { cookies } from "next/headers";
import { AuthService } from "@/services/auth.service";
import { UserService } from "@/services/user.service";
import { UserRepository } from "@/repositories/user.repository";
import { UserActivityService } from "@/services/userActivity.service";
import { requireAuth, requirePartner, getOptionalAuth } from "@/actions/_auth";

const JWT_SECRET = process.env.JWT_SECRET;

interface AuthenticatedUser {
  id: string;
  username: string;
  fullname: string;
  role: string;
}

// Local convenience wrappers that delegate to shared auth helper
async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const claims = await requireAuth();
  // Hydrate fullname if needed
  const user = await UserRepository.findOne({ _id: claims.id, published: true });
  if (!user) throw new Error("Not authenticated");
  return {
    id: claims.id,
    username: claims.username,
    fullname: (user as any).fullname || "",
    role: claims.role,
  };
}

async function getOptionalUser(): Promise<AuthenticatedUser | null> {
  const claims = await getOptionalAuth();
  if (!claims) return null;
  const user = await UserRepository.findOne({ _id: claims.id, published: true });
  if (!user) return null;
  return {
    id: claims.id,
    username: claims.username,
    fullname: (user as any).fullname || "",
    role: claims.role,
  };
}

export async function loginAction(payload: {
  username: string;
  password: string;
}) {
  await connect();
  const { username, password } = payload;
  const { token, isPartner } = await AuthService.login(username, password);

  const cookieStore = cookies();
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  cookieStore.set("auth", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  if (isPartner) {
    cookieStore.set("partner", "true", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge,
    });
  } else {
    cookieStore.delete("partner");
  }

  return { success: true };
}

export async function logoutAction() {
  const cookieStore = cookies();
  cookieStore.delete("auth");
  cookieStore.delete("partner");
  return { success: true };
}

export async function getCurrentUserAction() {
  const user = await getOptionalUser();
  if (!user) return null;
  return user;
}

export async function signupAction(payload: {
  username: string;
  password: string;
  role?: string;
  fullname?: string;
}) {
  await connect();
  return AuthService.signup(payload);
}

export async function changePasswordAction(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  const user = await getAuthenticatedUser();
  return UserService.changePassword(
    user.id,
    payload.currentPassword,
    payload.newPassword
  );
}

export async function listUsersAction(params: {
  search: string;
  page: number;
  limit: number;
  showDeleted: boolean;
}) {
  await requirePartner();
  return UserService.listUsers(
    params.search,
    params.page,
    params.limit,
    params.showDeleted
  );
}

export async function createUserAction(payload: {
  username: string;
  password: string;
  role?: string;
  fullname?: string;
}) {
  const currentUser = await requirePartner();
  return UserService.createUser(payload, currentUser.id);
}

export async function getUserAction(id: string) {
  await requirePartner();
  return UserService.getUser(id);
}

export async function updateUserAction(
  id: string,
  payload: {
    username?: string;
    fullname?: string;
    role?: string;
    password?: string;
  }
) {
  const currentUser = await requirePartner();
  return UserService.updateUser(id, payload, currentUser.id);
}

export async function deleteUserAction(id: string) {
  const currentUser = await requirePartner();
  await UserService.deleteUser(id, currentUser.id);
  return { success: true };
}

export async function reactivateUserAction(id: string) {
  const currentUser = await requirePartner();
  return UserService.reactivateUser(id, currentUser.id);
}

export async function getUserHistoryAction(params: {
  userId: string;
  page: number;
  limit: number;
}) {
  await requirePartner();
  return UserActivityService.getHistory(params.userId, params.page, params.limit);
}
