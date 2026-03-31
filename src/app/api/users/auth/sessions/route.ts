import connect from "@/db/mongo";
import { NextRequest, NextResponse } from "next/server";
import { listCurrentUserSessions } from "@/services/userAuthService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function GET(request: NextRequest) {
  try {
    await connect();
    const sessions = await listCurrentUserSessions(request);
    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: getServiceErrorMessage(error, "Failed to fetch sessions") },
      { status: getServiceErrorStatus(error) }
    );
  }
}
