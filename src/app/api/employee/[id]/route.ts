import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { EmployeeService } from "@/services/employee.service";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  await isAuthenticated(request);

  const { id } = params;
  const reqBody = await request.json();
  await EmployeeService.updateEmployee(id, reqBody);
  return Response.json(
    { message: "data updated successfully" },
    { status: 201 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  await isAuthenticated(request);

  const { id } = params;
  await EmployeeService.deleteEmployee(id);
  return Response.json({ message: "data deleted" }, { status: 200 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);
    const data = await EmployeeService.getEmployeeDetails(params.id);
    if (!data) {
      return Response.json({ message: "employee not found" }, { status: 404 });
    }
    return Response.json({ data }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: "Error fetching employee data", error },
      { status: 500 }
    );
  }
}
