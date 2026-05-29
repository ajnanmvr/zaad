// Import necessary modules and models
import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import Employee from "@/models/employees";
import { NextRequest } from "next/server";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function GET(
  request: NextRequest,
  { params }: { params: { search: string } }
) {
  try {
    await connect();
    await requirePermission(request, "entities.read");

    const companies = await Employee.find({
      name: { $regex: params.search, $options: "i" },
      published: true,
    })
      .populate("company", "name")
      .select("name color entityType company");

    return Response.json(companies, { status: 200 });
  } catch (error) {
    const status = getServiceErrorStatus(error);
    if (status >= 500) {
      console.error("Error fetching employees:", error);
    }

    return Response.json(
      { error: getServiceErrorMessage(error, "An error occurred while fetching emloyees") },
      { status }
    );
  }
}
