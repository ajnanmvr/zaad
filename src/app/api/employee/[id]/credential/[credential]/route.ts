import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { getEmployeeEntityById } from "@/services/entityService";
import { deleteEntityCredential, updateEntityCredential } from "@/services/entityCredentialService";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; credential: string } }
) {
  try {
    await connect();
    await requirePermission(request, "documents.write");
    const { id, credential } = params;
    const employee = await getEmployeeEntityById(id);
    if (!employee) {
      return Response.json({ message: "Employee not found" }, { status: 404 });
    }

    const data = await updateEntityCredential(id, credential, await request.json());
    if (!data) {
      return Response.json({ message: "Credential not found" }, { status: 404 });
    }

    return Response.json({ message: "Credential updated successfully", data });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; credential: string } }
) {
  try {
    await connect();
    await requirePermission(request, "documents.write");
    const { id, credential } = params;
    const employee = await getEmployeeEntityById(id);
    if (!employee) {
      return Response.json({ message: "Employee not found" }, { status: 404 });
    }

    const data = await deleteEntityCredential(id, credential);
    if (!data) {
      return Response.json({ message: "Credential not found" }, { status: 404 });
    }

    return Response.json({ message: "Credential deleted successfully" });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}
