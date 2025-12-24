import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { CompanyService } from "@/services/company.service";
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; doc: string } }
) {

  try {
    await connect();
    await isAuthenticated(request);
    const { id, doc } = params;
    const updateFields = await request.json();
    const { company, documentIndex } = await CompanyService.updateCompanyDocument(
      id,
      doc,
      updateFields
    );
    if (!company) {
      return Response.json({ message: "Company not found" }, { status: 404 });
    }
    if (documentIndex === null) {
      return Response.json({ message: "Document not found" }, { status: 404 });
    }
    return Response.json({ message: "Document updated successfully", data: company });
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
    const { company, documentIndex } = await CompanyService.deleteCompanyDocument(id, doc);
    if (!company) {
      return Response.json({ message: "Company not found" }, { status: 404 });
    }
    if (documentIndex === null) {
      return Response.json({ message: "Document not found" }, { status: 404 });
    }
    return Response.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}

