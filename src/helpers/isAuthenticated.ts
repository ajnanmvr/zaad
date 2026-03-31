import { NextRequest } from "next/server";
import { requireAuth, requirePermission } from "@/auth/guards";

export async function isAuthenticated(request: NextRequest) {
    await requireAuth(request);
    return true;
}

export async function isAdmin(request: NextRequest) {
    await requirePermission(request, "admin.access");
    return true;
}
