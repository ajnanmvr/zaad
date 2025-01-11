import connect from "@/db/connect";
import Invoice from "@/models/invoice";
import { TInvoiceItemsData } from "@/types/invoice";
import formatDate from "@/utils/formatDate";
import { NextRequest } from "next/server";

export async function POST(request:NextRequest) {
  try {
    await connect();
    const reqBody = await request.json();
    const data = await Invoice.create(reqBody);
    return Response.json(
      { message: "Created new payment invoice", data },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    const searchParams = request.nextUrl.searchParams;
    const pageNumber = searchParams.get("page") || 0;
    const contentPerSection = 10;
    const invoice = await Invoice.find({ published: true })
      .populate("createdBy")
      .skip(+pageNumber * contentPerSection)
      .limit(contentPerSection + 1)
      .sort({ createdAt: -1 });

    if (!invoice || invoice.length === 0) {
      return Response.json(
        { message: "No invoice found", count: 0, hasMore: false, records: [] },
        { status: 200 }
      );
    }

    const hasMore = invoice.length > contentPerSection;
    const transformedData = invoice
      .slice(0, contentPerSection)
      .map((invoice) => {
        return {
          id: invoice._id,
          client: invoice.client,
          purpose: invoice.purpose,
          invoiceNo: invoice.suffix + invoice.invoiceNo,
          amount: invoice.items.reduce(
            (acc: number, item: TInvoiceItemsData) =>
              acc + item.rate * item.quantity,
            0
          ),
          date: formatDate(invoice.date),
        };
      });
    return Response.json(
      { hasMore, invoices: transformedData },
      { status: 200 }
    );
  } catch (error) {
    return Response.json({ error }, { status: 401 });
  }
}
