"use server";

import "server-only";

import connect from "@/db/mongo";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { SearchService } from "@/services/search.service";

const JWT_SECRET = process.env.JWT_SECRET;

async function requireAuth() {
  const token = cookies().get("auth")?.value;
  if (!token || !JWT_SECRET) throw new Error("Not authenticated");
  await connect();
  jwt.verify(token, JWT_SECRET);
  return true;
}

// ============================================
// SEARCH ACTIONS
// ============================================

export async function searchAction(keyword: string | null) {
  await requireAuth();
  return SearchService.search(keyword);
}
