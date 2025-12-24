import { NextRequest } from "next/server";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import connect from "@/db/mongo";
import { EmployeeService } from "@/services/employee.service";
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);
    const { count, data } = await EmployeeService.listEmployeesByCompany(params.id);
    return Response.json({ count, data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching employees by company:", error);
    return Response.json(
      { error: "Error fetching employees" },
      { status: 500 }
    );
  }
}
