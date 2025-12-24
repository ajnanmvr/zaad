// Import necessary modules and models
import connect from "@/db/mongo";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
import { CompanyRepository } from "@/repositories/company.repository";


export async function GET(
  request: NextRequest,
  { params }: { params: { search: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);
    const companies = await CompanyRepository.searchByName(params.search);

    return Response.json(companies, { status: 200 });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return Response.json(
      { error: "An error occurred while fetching companies" },
      { status: 500 }
    );
  }
}
