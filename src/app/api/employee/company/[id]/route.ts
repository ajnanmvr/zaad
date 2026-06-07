import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import connect from "@/db/mongo";
import { listEmployeesByCompanyEntity } from "@/services/entityService";
import { PAGINATION, parsePaginationParams } from "@/config/pagination";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await requirePermission(request, "entities.read");
    
    const { page, limit } = parsePaginationParams(
      request.nextUrl.searchParams,
      PAGINATION.LIMITS.ENTITY_LIST
    );

    const search = request.nextUrl.searchParams.get("search")?.trim();
    const sortByParam = request.nextUrl.searchParams.get("sortBy");
    const createdWithinDaysParam = request.nextUrl.searchParams.get("createdWithinDays");
    const createdWithinDays = createdWithinDaysParam
      ? Number(createdWithinDaysParam)
      : undefined;

    const response = await listEmployeesByCompanyEntity(params.id, page, limit, {
      search: search || undefined,
      sortBy:
        sortByParam === "newest" ||
        sortByParam === "oldest" ||
        sortByParam === "name-asc" ||
        sortByParam === "name-desc"
          ? sortByParam
          : undefined,
      createdWithinDays:
        typeof createdWithinDays === "number" && Number.isFinite(createdWithinDays)
          ? createdWithinDays
          : undefined,
    });

    return Response.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching employees by company:", error);
    return Response.json(
      { error: "Error fetching employees" },
      { status: 500 }
    );
  }
}
