"use server";

import "server-only";

import connect from "@/db/mongo";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { AuthService } from "@/services/auth.service";
import { UserService } from "@/services/user.service";
import { UserRepository } from "@/repositories/user.repository";
import { UserActivityService } from "@/services/userActivity.service";

const JWT_SECRET = process.env.JWT_SECRET;

interface AuthenticatedUser {
  id: string;
  username: string;
  fullname: string;
  role: string;
}

async function getAuthToken() {
  const token = cookies().get("auth")?.value;
  if (!token) throw new Error("Not authenticated");
  if (!JWT_SECRET) throw new Error("Missing JWT secret");
  return token;
}

async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  await connect();
  const token = await getAuthToken();
  if (!JWT_SECRET) throw new Error("Missing JWT secret");
  
  const decoded = jwt.verify(token, JWT_SECRET) as unknown as {
    id: string;
    username: string;
    role: string;
  };

  const user = await UserRepository.findOne({
    _id: decoded.id,
    published: true,
  });

  if (!user) throw new Error("Not authenticated");

  return {
    id: (user as any)._id.toString(),
    username: (user as any).username,
    fullname: (user as any).fullname || "",
    role: (user as any).role,
  };
}

async function getOptionalUser(): Promise<AuthenticatedUser | null> {
  try {
    return await getAuthenticatedUser();
  } catch {
    return null;
  }
}

async function requirePartner(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (user.role !== "partner") throw new Error("User is not a partner");
  return user;
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
