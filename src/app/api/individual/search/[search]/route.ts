// Import necessary modules and models
import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import Individual from "@/models/individuals";
import { NextRequest } from "next/server";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function GET(
  request: NextRequest,
  { params }: { params: { search: string } }
) {
  try {
    await connect();
    await requirePermission(request, "entities.read");

    const individuals = await Individual.find({
      name: { $regex: params.search, $options: "i" },
      published: true,
    }).select("name color entityType");

    return Response.json(individuals, { status: 200 });
  } catch (error) {
    const status = getServiceErrorStatus(error);
    if (status >= 500) {
      console.error("Error fetching individuals:", error);
    }

    return Response.json(
      { error: getServiceErrorMessage(error, "An error occurred while fetching individuals") },
      { status }
    );
  }
}
