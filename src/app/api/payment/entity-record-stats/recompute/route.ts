import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import { isAdminRole, recomputeCreditDebitStats } from "@/services/paymentService";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Rebuilds only the credit/debit list data (entity record stats).
export async function POST(request: NextRequest) {
  try {
    await connect();
    const principal = await requirePermission(request, "payments.write");

    if (!isAdminRole(principal.role)) {
      return Response.json({ error: "Admin role required" }, { status: 403 });
    }

    const result = await recomputeCreditDebitStats();
    return Response.json({ message: "Credit/debit list regenerated", ...result }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to regenerate credit/debit list") },
      { status: getServiceErrorStatus(error) },
    );
  }
}
