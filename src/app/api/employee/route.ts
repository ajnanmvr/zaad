import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { EmployeeService } from "@/services/employee.service";
export async function POST(request: NextRequest) {
  try {
    await connect();
    await isAuthenticated(request);

    const reqBody = await request.json();
    const data = await EmployeeService.createEmployee(reqBody);

    return Response.json(
      { message: "Created new employee", data },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await isAuthenticated(request);
    const { count, data } = await EmployeeService.listEmployeesSummaries();
    return Response.json({ count, data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return Response.json(
      { error: "Error fetching employees" },
      { status: 500 }
    );
  }
}
