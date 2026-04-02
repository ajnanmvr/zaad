import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import Individual from "@/models/individuals";
import { createEntityDocument } from "@/services/entityDocumentService";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await requirePermission(request, "documents.write");
    const { id } = params;
    const reqBody = await request.json();
    const individual = await Individual.findById(id);
    if (!individual) {
      return Response.json({ message: "Individual not found" }, { status: 404 });
    }

    const data = await createEntityDocument(id, reqBody);

    return Response.json({ message: "Document added successfully", data });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}