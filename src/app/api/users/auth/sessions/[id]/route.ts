import connect from "@/db/mongo";
import { NextRequest, NextResponse } from "next/server";
import {
  createLogoutResponse,
  revokeCurrentUserSessionById,
} from "@/services/userAuthService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    const result = await revokeCurrentUserSessionById(request, params.id);

    if (result.isCurrentSession) {
      return await createLogoutResponse(request);
    }

    return NextResponse.json({ message: "Session revoked" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: getServiceErrorMessage(error, "Failed to revoke session") },
      { status: getServiceErrorStatus(error) }
    );
  }
}
