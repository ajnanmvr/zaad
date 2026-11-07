import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { deleteJob, getJob, updateJob } from "@/services/jobService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

function fail(error: unknown, fallback: string) {
  return Response.json(
    { error: getServiceErrorMessage(error, fallback) },
    { status: getServiceErrorStatus(error) },
  );
}

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    await connect();
    await requirePermission(request, "payments.view.transactions");
    return Response.json(await getJob(params.id), { status: 200 });
  } catch (error) {
    return fail(error, "Failed to fetch job");
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    await connect();
    await requirePermission(request, "payments.update.transactions");
    const data = await updateJob(params.id, await request.json());
    return Response.json({ message: "Job updated", data }, { status: 200 });
  } catch (error) {
    return fail(error, "Failed to update job");
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    await connect();
    await requirePermission(request, "payments.delete.transactions");
    await deleteJob(params.id);
    return Response.json({ message: "Job deleted" }, { status: 200 });
  } catch (error) {
    return fail(error, "Failed to delete job");
  }
}
