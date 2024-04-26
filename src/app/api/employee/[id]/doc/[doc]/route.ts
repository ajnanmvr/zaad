import connect from "@/db/connect";
import Employee from "@/models/employees";
import { fetchDocuments } from "@/utils/fetchDocuments";
connect();
export async function PUT(
  request: Request,
  { params }: { params: { id: string; doc: string } }
) {
  const { id, doc } = params;
  const { name, issueDate, expiryDate, attachment } = await request.json();
  const Data = await Employee.findById(id);

  try {
    const { data, documentIndex } = await fetchDocuments(id, doc, Data);
    if (!data) {
      return Response.json({ message: "Employee not found" });
    }
    if (documentIndex === null) {
      return Response.json({ message: "Document not found" });
    }
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
  request: Request,
  { params }: { params: { id: string; doc: string } }
) {
  const { id, doc } = params;
  const Data = await Employee.findById(id);

  try {
    const { data, documentIndex } = await fetchDocuments(id, doc, Data);
    if (!data) {
      return Response.json({ message: "Employee not found" });
    }

    if (documentIndex === null) {
      return Response.json({ message: "Document not found" });
    }

    data.documents.splice(documentIndex, 1);

    await data.save();

    return Response.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}
