import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { getCompanyEntityById } from "@/services/entityService";
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
    const company = await getCompanyEntityById(id);
    if (!company) {
      return Response.json({ message: "Company not found" }, { status: 404 });
    }

    const data = await createEntityDocument(id, reqBody);
    return Response.json({ message: "Document added successfully", data });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}
