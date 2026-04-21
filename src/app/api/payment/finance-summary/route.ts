import connect from "@/db/mongo";
import Records from "@/models/records";
import { requirePermission } from "@/auth/guards";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.view.records-summary");

    const totalTransactions = await Records.countDocuments({ deletedAt: null });

    return Response.json(
      {
        summary: {
          totalTransactions,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const status = getServiceErrorStatus(error);
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to load finance summary") },
      { status },
    );
  }
}
