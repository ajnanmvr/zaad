import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { EmployeeService } from "@/services/employee.service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; doc: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);
    const { id } = params;
    const reqBody = await request.json();
    const data = await EmployeeService.addEmployeeDocument(id, reqBody);
    if (!data) {
      return Response.json({ message: "Employee not found" }, { status: 404 });
    }
    return Response.json({ message: "Document added successfully", data });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}
