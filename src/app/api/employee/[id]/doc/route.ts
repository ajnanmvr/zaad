import connect from "@/db/connect";
import Employee from "@/models/employees";
import { fetchDocuments } from "@/helpers/fetchDocuments";

export async function POST(
  request: Request,
  { params }: { params: { id: string; doc: string } }
) {
  try {
    await connect();
    const { id, doc } = params;
    const reqBody = await request.json();
    const Data = await Employee.findById(id);
    const { data } = await fetchDocuments(id, doc, Data);
    if (!data) {
      return Response.json({ message: "Emloyee not found" });
    }
    data.documents.push(reqBody);
    await data.save();
    return Response.json({ message: "Document added successfully", data });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}
