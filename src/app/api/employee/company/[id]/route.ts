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
    const response = await listEmployeesByCompanyEntity(params.id, page, limit);

    return Response.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching employees by company:", error);
    return Response.json(
      { error: "Error fetching employees" },
      { status: 500 }
    );
  }
}
