import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { listArchivedDocuments } from "@/services/entityDocumentService";
import { PAGINATION, parsePaginationParams } from "@/config/pagination";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "documents.read");

    const { page, limit } = parsePaginationParams(
      request.nextUrl.searchParams,
      PAGINATION.LIMITS.EXPIRY_DOCUMENTS
    );

    const response = await listArchivedDocuments(page, limit);

    return Response.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching archived documents:", error);
    return Response.json(
      { error: "Error fetching archived documents" },
      { status: 500 }
    );
  }
}
