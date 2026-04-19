import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { listPaymentAccounts } from "@/services/paymentService";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    await connect();
    await requirePermission(request, "payments.read");
    const response = await listPaymentAccounts(request.nextUrl.searchParams);
    return Response.json(response, { status: 200 });
  } catch (error) {
    const status = getServiceErrorStatus(error);
    if (status >= 500) {
      console.error("Error fetching records:", error);
    }
    return Response.json({ error: getServiceErrorMessage(error, "Error fetching records") }, { status });
  }
}


