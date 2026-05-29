import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { ALL_PERMISSIONS, PERMISSION_GROUPS } from "@/auth/permissionCatalog";
import { listRoles } from "@/services/roleService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "settings.read");

    const roles = await listRoles();
    return Response.json(
      {
        permissions: ALL_PERMISSIONS,
        groups: PERMISSION_GROUPS,
        roles,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to fetch permissions") },
      { status: getServiceErrorStatus(error) }
    );
  }
}

