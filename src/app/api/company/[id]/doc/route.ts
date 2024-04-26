import connect from "@/db/connect";
import { fetchDocuments } from "@/utils/fetchDocuments";
connect();
export async function POST(
  request: Request,
  { params }: { params: { id: string; doc: string } }
) {
  const { id, doc } = params;
  const reqBody = await request.json();
  try {
    const { company } = await fetchDocuments(id, doc);
    if (!company) {
      return Response.json({ message: "Company not found" });
    }
    company.documents.push(reqBody);
    await company.save();
    return Response.json({ message: "Document added successfully", company });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server Error" }, { status: 500 });
  }
}
