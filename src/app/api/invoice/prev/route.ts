import connect from "@/db/connect";
import Invoice from "@/models/invoice";

connect();

export async function GET(request: Request) {
  try {
    const { suffix, invoiceNo, title } = await Invoice.findOne({
      published: true,
    })
      .sort({ createdAt: -1 })
      .select("invoiceNo suffix title");
    return Response.json(
      { suffix, invoiceNo: invoiceNo + 1, title },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
