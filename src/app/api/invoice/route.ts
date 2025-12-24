import connect from "@/db/mongo";
import { InvoiceService } from "@/services/invoice.service";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  await connect();
  const body = await req.json();

  const data = await InvoiceService.createInvoice(body);
  return Response.json({ message: "Invoice created", data }, { status: 201 });
}

export async function GET(req: NextRequest) {
  await connect();
  const params = req.nextUrl.searchParams;

  const page = Number(params.get("page") || 0);
  const search = params.get("search");

  const result = await InvoiceService.listInvoices(search, page);
  return Response.json(result);
}
