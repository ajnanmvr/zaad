import connect from "@/db/connect";
import Invoice from "@/models/invoice";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export async function GET(request:NextRequest) {
  try {
    await connect();
    let { suffix, invoiceNo, title } = await Invoice.findOne({
      published: true,
    })

      .sort({ createdAt: -1 })
      .select("invoiceNo suffix title");

    if (invoiceNo < 1) {
      return Response.json({ suffix, invoiceNo: 1, title }, { status: 201 });
    }
    return Response.json(
      { suffix, invoiceNo: invoiceNo || 0, title },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
