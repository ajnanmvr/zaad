import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest, NextResponse } from "next/server";
import { listLiabilitySummary } from "@/services/paymentService";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");
    const response = await listLiabilitySummary();
    return NextResponse.json(response);
  } catch (error) {
    const status = getServiceErrorStatus(error);
    const message = getServiceErrorMessage(error, "Error retrieving records");
    return NextResponse.json({ message, error: message }, { status });
  }
}


