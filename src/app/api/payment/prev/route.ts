import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { getPreviousPaymentSequence } from "@/services/paymentService";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");
    const { suffix, number } = await getPreviousPaymentSequence();
    return Response.json({ suffix, number: number || 0 }, { status: 201 });
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
