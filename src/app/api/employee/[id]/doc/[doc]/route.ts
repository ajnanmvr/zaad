import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { EmployeeService } from "@/services/employee.service";
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; doc: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);

    const { id, doc } = params;
    const updateFields = await request.json();
    const { employee, documentIndex } = await EmployeeService.updateEmployeeDocument(id, doc, updateFields);
    if (!employee) {
      return Response.json({ message: "Employee not found" }, { status: 404 });
    }
    if (documentIndex === null) {
      return Response.json({ message: "Document not found" }, { status: 404 });
    }
    return Response.json({ message: "Document updated successfully", data: employee });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; doc: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);

    const { id, doc } = params;
    const { employee, documentIndex } = await EmployeeService.deleteEmployeeDocument(id, doc);
    if (!employee) {
      return Response.json({ message: "Employee not found" }, { status: 404 });
    }
    if (documentIndex === null) {
      return Response.json({ message: "Document not found" }, { status: 404 });
    }
    return Response.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}
