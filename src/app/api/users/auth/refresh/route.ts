import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import {
  buildLoginResponse,
  createRefreshDeniedResponse,
  rotateRefreshToken,
} from "@/services/userAuthService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function POST(request: NextRequest) {
  try {
    await connect();
    const result = await rotateRefreshToken(request);
    return buildLoginResponse(result.tokens, result.role);
  } catch (error) {
    const status = getServiceErrorStatus(error);
    const message = getServiceErrorMessage(error, "Refresh failed");

    if (status === 401) {
      return createRefreshDeniedResponse(message, status);
    }

    return Response.json({ error: message }, { status });
  }
}
