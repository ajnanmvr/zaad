import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { returnHandover, updateHandover, deleteHandover } from "@/services/physicalHandoverService";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    const principal = await requirePermission(request, "entities.write");
    const reqBody = await request.json();
    const { id } = params;

    let data;
    if (reqBody.action === "return") {
      data = await returnHandover(id, principal.userId, reqBody.returnNote || reqBody.remarks);
    } else {
      data = await updateHandover(id, reqBody);
    }

    if (!data) {
      return Response.json({ message: "Handover record not found" }, { status: 404 });
    }

    return Response.json(
      { message: "Handover updated", data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating handover:", error);
    return Response.json({ error: error.message || "Internal Server Error" }, { status: error.status || 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await requirePermission(request, "entities.write");
    const { id } = params;

    const data = await deleteHandover(id);
    if (!data) {
      return Response.json({ message: "Handover record not found" }, { status: 404 });
    }

    return Response.json(
      { message: "Handover deleted" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting handover:", error);
    return Response.json({ error: error.message || "Internal Server Error" }, { status: error.status || 500 });
  }
}
