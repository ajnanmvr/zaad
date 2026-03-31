import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { getCompanyEntityById } from "@/services/entityService";
import {
  deleteEntityDocument,
  updateEntityDocument,
} from "@/services/entityDocumentService";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; doc: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);
    const { id, doc } = params;
    const { name, issueDate, expiryDate, attachment } = await request.json();
    const company = await getCompanyEntityById(id);
    if (!company) {
      return Response.json({ message: "Company not found" }, { status: 404 });
    }

    const data = await updateEntityDocument(id, doc, {
      name,
      issueDate,
      expiryDate,
      attachment,
    });

    if (!data) {
      return Response.json({ message: "Document not found" }, { status: 404 });
    }

    return Response.json({ message: "Document updated successfully", data });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; doc: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);
    const { id, doc } = params;
    const company = await getCompanyEntityById(id);
    if (!company) {
      return Response.json({ message: "Company not found" }, { status: 404 });
    }

    const data = await deleteEntityDocument(id, doc);
    if (!data) {
      return Response.json({ message: "Document not found" }, { status: 404 });
    }

    return Response.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}

