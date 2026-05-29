import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { listArchivedDocuments } from "@/services/entityDocumentService";
import { PAGINATION, parsePaginationParams } from "@/config/pagination";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "documents.read");

    const { page, limit } = parsePaginationParams(
      request.nextUrl.searchParams,
      PAGINATION.LIMITS.EXPIRY_DOCUMENTS
    );

    const response = await listArchivedDocuments(page, limit);

    return Response.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    const status = getServiceErrorStatus(error);
    if (status >= 500) {
      console.error("Error fetching archived documents:", error);
    }

    return Response.json(
      { error: getServiceErrorMessage(error, "Error fetching archived documents") },
      { status }
    );
  }
}

