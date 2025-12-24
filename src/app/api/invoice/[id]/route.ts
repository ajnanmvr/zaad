import connect from "@/db/mongo";
import { InvoiceService } from "@/services/invoice.service";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: any) {
  await connect();
  const editMode = req.nextUrl.searchParams.get("editmode") !== null;

  const data = await InvoiceService.getInvoiceById(params.id, editMode);
  return Response.json(data);
}

export async function PUT(req: NextRequest, { params }: any) {
  await connect();
  const body = await req.json();

  await InvoiceService.updateInvoice(params.id, body);
  return Response.json({ message: "Invoice updated" });
}

export async function DELETE(_: NextRequest, { params }: any) {
  await connect();

  await InvoiceService.deleteInvoice(params.id);
  return Response.json({ message: "Invoice deleted" });
}
