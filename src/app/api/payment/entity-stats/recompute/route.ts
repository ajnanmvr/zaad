import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import { isAdminRole, recomputeAllEntityLedgerStats } from "@/services/paymentService";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();
    const principal = await requirePermission(request, "payments.write");

    if (!isAdminRole(principal.role)) {
      return Response.json({ error: "Admin role required" }, { status: 403 });
    }

    const result = await recomputeAllEntityLedgerStats();
    return Response.json(
      {
        message: "Entity ledger stats recomputed",
        ...result,
      },
      { status: 200 },
    );
  } catch (error) {
    const status = getServiceErrorStatus(error);
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to recompute entity ledger stats") },
      { status },
    );
  }
}
