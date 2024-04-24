import connect from "@/db/connect";
import Records from "@/models/records";
connect();
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await Records.find({
      published: true,
      invoiceNo: params.id,
      type: "income",
    });
    return Response.json(
      { message: `Fetched invoice ${params.id}`, data },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
