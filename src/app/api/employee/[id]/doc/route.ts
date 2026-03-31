import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { getEmployeeEntityById } from "@/services/entityService";
import { createEntityDocument } from "@/services/entityDocumentService";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);
    const { id } = params;
    const reqBody = await request.json();
    const employee = await getEmployeeEntityById(id);
    if (!employee) {
      return Response.json({ message: "Emloyee not found" }, { status: 404 });
    }

    const data = await createEntityDocument(id, reqBody);

    return Response.json({ message: "Document added successfully", data });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}
