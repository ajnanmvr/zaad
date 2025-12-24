import "server-only";

import connect from "@/db/mongo";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export type AuthClaims = {
  id: string;
  username: string;
  role: string;
};

export async function requireAuth(): Promise<AuthClaims> {
  const token = cookies().get("auth")?.value;
  if (!token || !JWT_SECRET) throw new Error("Not authenticated");

  await connect();
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  return {
    id: decoded.id?.toString?.() || decoded.id,
    username: decoded.username,
    role: decoded.role,
  };
}

export function withAuth<T extends any[], R>(
  fn: (claims: AuthClaims, ...args: T) => Promise<R> | R
) {
  return async (...args: T): Promise<R> => {
    const claims = await requireAuth();
    return fn(claims, ...args);
  };
}

export async function getOptionalAuth(): Promise<AuthClaims | null> {
  try {
    return await requireAuth();
  } catch {
    return null;
  }
}

export async function requirePartner(): Promise<AuthClaims> {
  const claims = await requireAuth();
  if (claims.role !== "partner") throw new Error("User is not a partner");
  return claims;
}
