import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { listIndividualEntities } from "@/services/entityService";
import { PAGINATION, parsePaginationParams } from "@/config/pagination";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "entities.read");

    const { page, limit } = parsePaginationParams(
      request.nextUrl.searchParams,
      PAGINATION.LIMITS.ENTITY_LIST
    );
    const response = await listIndividualEntities(page, limit);

    return Response.json(response, { status: 200 });
  } catch (error) {
    const status = getServiceErrorStatus(error);
    if (status >= 500) {
      console.error("Error fetching individuals:", error);
    }

    return Response.json(
      { error: getServiceErrorMessage(error, "Error fetching individuals") },
      { status }
    );
  }
}

