import connect from "@/db/connect";
import Company from "@/models/companies";
import { fetchDocuments } from "@/helpers/fetchDocuments";
import { NextRequest } from "next/server";
import { isAuthenticated } from "@/helpers/isAuthenticated";
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; doc: string } }
) {
  
  try {
    await connect();
    await isAuthenticated(request);
    const { id, doc } = params;
    const { name, issueDate, expiryDate, attachment } = await request.json();
    const Data = await Company.findById(id);



    const { data, documentIndex } = await fetchDocuments(id, doc,Data);
    if (!data) {
      return Response.json({ message: "Company not found" });
    }

    if (documentIndex === null) {
      return Response.json({ message: "Document not found" });
    }

    // Update the document fields
    if (name) data.documents[documentIndex].name = name;
    if (issueDate) data.documents[documentIndex].issueDate = issueDate;
    if (expiryDate) data.documents[documentIndex].expiryDate = expiryDate;
    if (attachment) data.documents[documentIndex].attachment = attachment;

    await data.save();
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
    const Data = await Company.findById(id);

    const { data, documentIndex } = await fetchDocuments(id, doc,Data);
    if (!data) {
      return Response.json({ message: "Company not found" });
    }

    if (documentIndex === null) {
      return Response.json({ message: "Document not found" });
    }

    // Remove the document from the array
    data.documents.splice(documentIndex, 1);

    // Save the updated company without the deleted document
    await data.save();

    return Response.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}

