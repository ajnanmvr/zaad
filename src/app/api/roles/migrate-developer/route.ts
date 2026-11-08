import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { AuthError, requireAuth } from "@/auth/guards";
import { isDeveloperRole, isLegacySuperAdminRole } from "@/auth/roleConstants";
import { migrateSuperAdminToDeveloperAndPartner } from "@/services/roleService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export const dynamic = "force-dynamic";

// One-off rollout: legacy superadmin -> developer (one named user) + partner (everyone else).
// Idempotent. Only a legacy superadmin (before the rollout) or the developer may run it, so a
// partner cannot promote themselves.
export async function POST(request: NextRequest) {
  try {
    await connect();
    const principal = await requireAuth(request);
    if (!isLegacySuperAdminRole(principal.role) && !isDeveloperRole(principal.role)) {
      throw new AuthError("Only a superadmin or developer can run this migration", 403);
    }

    const { developerUsername } = await request.json();
    const result = await migrateSuperAdminToDeveloperAndPartner(String(developerUsername || ""));
    return Response.json({ message: "Roles migrated", ...result }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to migrate roles") },
      { status: getServiceErrorStatus(error) }
    );
  }
}
