import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { createHandover, listHandovers } from "@/services/physicalHandoverService";
import { PAGINATION, parsePaginationParams } from "@/config/pagination";

export async function POST(request: NextRequest) {
  try {
    await connect();
    const principal = await requirePermission(request, "entities.write");
    const reqBody = await request.json();
    
    // Ensure entity is provided
    if (!reqBody.entity) {
      return Response.json({ error: "Entity is required" }, { status: 400 });
    }
    if (!reqBody.documentName) {
      return Response.json({ error: "Document name is required" }, { status: 400 });
    }

    const data = await createHandover({
      entity: reqBody.entity,
      documentName: reqBody.documentName,
      receiveNote: reqBody.receiveNote || reqBody.remarks,
      // Keep remarks for backward compatibility in existing views/data.
      remarks: reqBody.receiveNote || reqBody.remarks,
      receivedAt: reqBody.receivedAt || new Date(),
      status: "received",
      receivedBy: principal.userId,
    });

    return Response.json(
      { message: "Handover recorded", data },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating handover:", error);
    return Response.json({ error: error.message || "Internal Server Error" }, { status: error.status || 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "entities.read");

    const { page, limit } = parsePaginationParams(
      request.nextUrl.searchParams,
      PAGINATION.LIMITS.ENTITY_LIST
    );
    const search = request.nextUrl.searchParams.get("search") || undefined;
    const entityId = request.nextUrl.searchParams.get("entityId") || undefined;
    const rawStatus = request.nextUrl.searchParams.get("status");
    const status = rawStatus === "pending" || rawStatus === "returned" || rawStatus === "all"
      ? rawStatus
      : undefined;
    
    const response = await listHandovers(page, limit, search, entityId, status);

    return Response.json(response, { status: 200 });
  } catch (error: any) {
    console.error("Error listing handovers:", error);
    return Response.json({ error: error.message || "Internal Server Error" }, { status: error.status || 500 });
  }
}
