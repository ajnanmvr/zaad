"use server";

import "server-only";

import { cookies } from "next/headers";
import { SearchService } from "@/services/search.service";
import { requireAuth } from "@/actions/_auth";

const JWT_SECRET = process.env.JWT_SECRET; // kept for potential future cookie checks

// ============================================
// SEARCH ACTIONS
// ============================================

export async function searchAction(keyword: string | null) {
  await requireAuth();
  return SearchService.search(keyword);
}
