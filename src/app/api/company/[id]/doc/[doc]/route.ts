import connect from "@/db/connect";
import Company from "@/models/companies";
import { fetchDocuments } from "@/utils/fetchDocuments";
connect();

export async function GET(
  request: Request,
  { params }: { params: { id: string; doc: string } }
) {
  try {
    const Document = await Company.findOne({ _id: params.id }).select(
      "documents"
    );

    if (!Document) {
      return Response.json({ message: "Document not found" }, { status: 404 });
    }

    return Response.json({ message: Document });
  } catch (error) {
    return Response.json({ error }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; doc: string } }
) {
  const { id, doc } = params;
  const { name, issueDate, expiryDate, attachment } = await request.json();

  try {
    const { company, documentIndex } = await fetchDocuments(id, doc);
    if (!company) {
      return Response.json({ message: "Company not found" });
    }

    if (documentIndex === null) {
      return Response.json({ message: "Document not found" });
    }

    // Update the document fields
    if (name) company.documents[documentIndex].name = name;
    if (issueDate) company.documents[documentIndex].issueDate = issueDate;
    if (expiryDate) company.documents[documentIndex].expiryDate = expiryDate;
    if (attachment) company.documents[documentIndex].attachment = attachment;

    await company.save();
    return Response.json({ message: "Document updated successfully", company });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; doc: string } }
) {
  const { id, doc } = params;

  try {
    const { company, documentIndex } = await fetchDocuments(id, doc);
    if (!company) {
      return Response.json({ message: "Company not found" });
    }

    if (documentIndex === null) {
      return Response.json({ message: "Document not found" });
    }

    // Remove the document from the array
    company.documents.splice(documentIndex, 1);

    // Save the updated company without the deleted document
    await company.save();

    return Response.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}

