import connect from "@/db/mongo";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
import { listIndividualEntities } from "@/services/entityService";
import { PAGINATION, parsePaginationParams } from "@/config/pagination";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await isAuthenticated(request);

    const { page, limit } = parsePaginationParams(
      request.nextUrl.searchParams,
      PAGINATION.LIMITS.ENTITY_LIST
    );
    const response = await listIndividualEntities(page, limit);

    return Response.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching individuals:", error);
    return Response.json(
      { error: "Error fetching individuals" },
      { status: 500 }
    );
  }
}
