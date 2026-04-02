import { NextRequest } from "next/server";

import { requirePermission } from "@/auth/guards";
import connect from "@/db/mongo";
import { archiveDocumentById } from "@/services/entityDocumentService";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await requirePermission(request, "documents.write");

    const reqBody = await request.json().catch(() => ({}));
    const data = await archiveDocumentById(params.id, reqBody?.archiveNotes);

    if (!data) {
      return Response.json({ message: "Document not found" }, { status: 404 });
    }

    return Response.json({ message: "Document archived successfully", data });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}
