// Import necessary modules and models
import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { searchCompaniesByName } from "@/services/companyService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";


export async function GET(
  request: NextRequest,
  { params }: { params: { search: string } }
) {
  try {
    await connect();
    await requirePermission(request, "entities.read");
    const companies = await searchCompaniesByName(params.search);

    return Response.json(companies, { status: 200 });
  } catch (error) {
    const status = getServiceErrorStatus(error);
    if (status >= 500) {
      console.error("Error fetching companies:", error);
    }

    return Response.json(
      { error: getServiceErrorMessage(error, "An error occurred while fetching companies") },
      { status }
    );
  }
}
