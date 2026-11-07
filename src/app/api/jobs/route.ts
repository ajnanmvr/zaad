import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { createJob, listJobs } from "@/services/jobService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.view.transactions");
    const params = request.nextUrl.searchParams;
    const data = await listJobs({
      query: params.get("q"),
      status: params.get("status"),
      entityId: params.get("entityId"),
      pageNumber: Number(params.get("page") || 0),
      limit: Number(params.get("limit") || 25),
    });
    return Response.json(data, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to fetch jobs") },
      { status: getServiceErrorStatus(error) },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connect();
    const principal = await requirePermission(request, "payments.create.transactions");
    const body = await request.json();
    const data = await createJob(body, principal.userId);
    return Response.json({ message: "Job created", data }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to create job") },
      { status: getServiceErrorStatus(error) },
    );
  }
}
