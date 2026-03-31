import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/auth/guards";

export async function isAuthenticated(request: NextRequest) {
    await requireAuth(request);
    return true;
}

export async function isPartner(request: NextRequest) {
    await requireRole(request, "partner");
    return true;
}
