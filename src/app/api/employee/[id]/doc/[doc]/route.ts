import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { getEmployeeEntityById } from "@/services/entityService";
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
    await requirePermission(request, "documents.write");

    const { id, doc } = params;
    const { category, name, issueDate, expiryDate, attachment } =
      await request.json();
    const employee = await getEmployeeEntityById(id);
    if (!employee) {
      return Response.json({ message: "Employee not found" }, { status: 404 });
    }

    const data = await updateEntityDocument(id, doc, {
      category,
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
    await requirePermission(request, "documents.write");

    const { id, doc } = params;
    const employee = await getEmployeeEntityById(id);
    if (!employee) {
      return Response.json({ message: "Employee not found" }, { status: 404 });
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
