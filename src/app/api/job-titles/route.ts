import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { createJobTitleSuggestion, listJobTitleSuggestions } from "@/services/jobTitleService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export const dynamic = "force-dynamic";

// Anyone who can use jobs can read the suggestions (the job forms need them).
export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.view.transactions");
    const suggestions = await listJobTitleSuggestions(request.nextUrl.searchParams.get("category"));
    return Response.json({ suggestions }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to load job title suggestions") },
      { status: getServiceErrorStatus(error) },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "settings.manage.job-titles");
    const data = await createJobTitleSuggestion(await request.json());
    return Response.json({ message: "Suggestion added", data }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to add suggestion") },
      { status: getServiceErrorStatus(error) },
    );
  }
}
