import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { AuthError, requireAuth } from "@/auth/guards";
import { isDeveloperRole } from "@/auth/roleConstants";
import { updateServiceFeeMonth } from "@/services/serviceFeeService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export const dynamic = "force-dynamic";

type Ctx = { params: { month: string } };

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    await connect();
    const principal = await requireAuth(request);
    if (!isDeveloperRole(principal.role)) {
      throw new AuthError("Only the developer can update server cost + maintenance charges details", 403);
    }
    const data = await updateServiceFeeMonth(params.month, await request.json(), principal.userId);
    return Response.json({ message: "Month updated", ...data }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to update month") },
      { status: getServiceErrorStatus(error) },
    );
  }
}
