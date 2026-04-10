import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { listEmployeePaymentRecords } from "@/services/paymentService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await requirePermission(request, "payments.read");
    const response = await listEmployeePaymentRecords(params.id);
    return Response.json(response, { status: 200 });
  } catch (error) {
    return Response.json({ error }, { status: 401 });
  }
}
