import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { peekNextJobId } from "@/services/jobService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export const dynamic = "force-dynamic";

// Preview of the Job ID the next job of this category would get (does not reserve it).
export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.create.transactions");
    const jobId = await peekNextJobId(request.nextUrl.searchParams.get("category"));
    return Response.json({ jobId }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to preview the next Job ID") },
      { status: getServiceErrorStatus(error) },
    );
  }
}
