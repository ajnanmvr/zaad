import connect from "@/db/mongo";
import { InvoiceService } from "@/services/invoice.service";

export const dynamic = "force-dynamic";

export async function GET() {
  await connect();
  const data = await InvoiceService.getNextInvoiceNo();
  return Response.json(data);
}
