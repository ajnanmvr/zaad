import connect from "@/db/mongo";
import { NextRequest, NextResponse } from "next/server";
import { createLogoutAllResponse } from "@/services/userAuthService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function POST(request: NextRequest) {
  try {
    await connect();
    return await createLogoutAllResponse(request);
  } catch (error) {
    return NextResponse.json(
      { error: getServiceErrorMessage(error, "Logout all failed") },
      { status: getServiceErrorStatus(error) }
    );
  }
}
