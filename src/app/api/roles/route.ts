import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { createRole, listRoles } from "@/services/roleService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "settings.read");

    const roles = await listRoles();
    return Response.json({ roles }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to fetch roles") },
      { status: getServiceErrorStatus(error) }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "settings.write");

    const payload = await request.json();
    const role = await createRole(payload);

    return Response.json({ message: "Role created", role }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to create role") },
      { status: getServiceErrorStatus(error) }
    );
  }
}
