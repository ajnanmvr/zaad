import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { AuthError, requireAuth } from "@/auth/guards";
import { getServiceFeeStatus } from "@/services/serviceFeeService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connect();
    const principal = await requireAuth(request);
    return Response.json(await getServiceFeeStatus(principal.role), { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to load server cost + maintenance charges status") },
      { status: getServiceErrorStatus(error) },
    );
  }
}
