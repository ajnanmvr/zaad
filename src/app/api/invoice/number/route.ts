import connect from "@/db/connect";
import Invoice from "@/models/invoice";

connect();

export async function GET(request: Request) {
  try {
    const { suffix, invoiceNo } = await Invoice.findOne()
      .sort({ createdAt: -1 })
      .select("invoiceNo suffix");
    return Response.json({ suffix, invoiceNo: invoiceNo + 1 }, { status: 201 });
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
