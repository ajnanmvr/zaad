import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { getPaymentRecordDetails } from "@/services/paymentService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  await requirePermission(request, "payments.read");

  const { id } = params;
  const response = await getPaymentRecordDetails(id);

  if (!response) {
    return Response.json({ error: "Record not found" }, { status: 404 });
  }

  return Response.json(response, { status: 200 });
}
