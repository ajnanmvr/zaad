import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { deleteRole, updateRole } from "@/services/roleService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function PUT(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    await connect();
    const principal = await requirePermission(request, "settings.write");

    const payload = await request.json();
    const role = await updateRole(params.name, payload, {
      performedById: principal.userId,
      request,
    });

    return Response.json({ message: "Role updated", role }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to update role") },
      { status: getServiceErrorStatus(error) }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    await connect();
    const principal = await requirePermission(request, "settings.write");

    await deleteRole(params.name, {
      performedById: principal.userId,
      request,
    });

    return Response.json({ message: "Role deleted" }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to delete role") },
      { status: getServiceErrorStatus(error) }
    );
  }
}
