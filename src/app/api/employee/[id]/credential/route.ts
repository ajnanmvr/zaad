import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { getEmployeeEntityById } from "@/services/entityService";
import { createEntityCredential } from "@/services/entityCredentialService";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await requirePermission(request, "documents.write");
    const { id } = params;
    const reqBody = await request.json();
    const employee = await getEmployeeEntityById(id);
    if (!employee) {
      return Response.json({ message: "Employee not found" }, { status: 404 });
    }

    const data = await createEntityCredential(id, reqBody);
    return Response.json({ message: "Credential added successfully", data });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}
