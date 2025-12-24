// Import necessary modules and models
import connect from "@/db/mongo";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
import { EmployeeRepository } from "@/repositories/employee.repository";

export async function GET(
  request: NextRequest,
  { params }: { params: { search: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);

    const companies = await EmployeeRepository.searchByName(params.search);

    return Response.json(companies, { status: 200 });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return Response.json(
      { error: "An error occurred while fetching emloyees" },
      { status: 500 }
    );
  }
}
