import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { AuthError, requireAuth } from "@/auth/guards";
import { isDeveloperRole } from "@/auth/roleConstants";
import { listServiceFeeMonths, recordServiceFeeBatch } from "@/services/serviceFeeService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export const dynamic = "force-dynamic";

// Only the developer manages server cost + maintenance charges months (partners are the ones being warned).
export async function GET(request: NextRequest) {
  try {
    await connect();
    const principal = await requireAuth(request);
    if (!isDeveloperRole(principal.role)) {
      throw new AuthError("Only the developer can view server cost + maintenance charges details", 403);
    }
    return Response.json(await listServiceFeeMonths(), { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to load server cost + maintenance charges months") },
      { status: getServiceErrorStatus(error) },
    );
  }
}

// Batch payment: marks `months` consecutive months from `fromMonth` as paid in one go.
export async function POST(request: NextRequest) {
  try {
    await connect();
    const principal = await requireAuth(request);
    if (!isDeveloperRole(principal.role)) {
      throw new AuthError("Only the developer can record server cost + maintenance charges payments", 403);
    }
    const data = await recordServiceFeeBatch(await request.json(), principal.userId);
    return Response.json({ message: "Payment recorded", ...data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to record payment") },
      { status: getServiceErrorStatus(error) },
    );
  }
}
