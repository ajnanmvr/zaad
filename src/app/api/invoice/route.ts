import connect from "@/db/connect";
import Invoice from "@/models/invoice";
import { TInvoiceItemsData } from "@/types/invoice";
import formatDate from "@/utils/formatDate";
import { NextRequest } from "next/server";

connect();

export async function POST(request: Request) {
  try {
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
    const searchParams = request.nextUrl.searchParams;
    const pageNumber = searchParams.get("page") || 0;
    const contentPerSection = 10;
    const invoice = await Invoice.find({ published: true })
      .populate(["createdBy", "company", "employee"])
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
        const client = () => {
          const { company, employee, other } = invoice;
          return company
            ? { name: company.name, id: company._id, type: "company" }
            : employee
              ? { name: employee.name, id: employee._id, type: "employee" }
              : other
                ? { name: other, type: "other" }
                : null;
        };

        return {
          id: invoice._id,
          client: client(),
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
