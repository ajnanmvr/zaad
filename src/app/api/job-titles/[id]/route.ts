import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { deleteJobTitleSuggestion, updateJobTitleSuggestion } from "@/services/jobTitleService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    await connect();
    await requirePermission(request, "settings.manage.job-titles");
    const data = await updateJobTitleSuggestion(params.id, await request.json());
    return Response.json({ message: "Suggestion updated", data }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to update suggestion") },
      { status: getServiceErrorStatus(error) },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    await connect();
    await requirePermission(request, "settings.manage.job-titles");
    await deleteJobTitleSuggestion(params.id);
    return Response.json({ message: "Suggestion deleted" }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to delete suggestion") },
      { status: getServiceErrorStatus(error) },
    );
  }
}
