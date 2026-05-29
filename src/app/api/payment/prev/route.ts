import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { getPreviousPaymentSequence } from "@/services/paymentService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");
    const { suffix, number } = await getPreviousPaymentSequence();
    return Response.json({ suffix, number: number || 0 }, { status: 201 });
  } catch (error) {
    const status = getServiceErrorStatus(error);
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to fetch previous payment sequence") },
      { status }
    );
  }
}
