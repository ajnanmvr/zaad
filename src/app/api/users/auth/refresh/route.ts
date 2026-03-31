import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import {
  buildLoginResponse,
  createRefreshDeniedResponse,
  rotateRefreshToken,
} from "@/services/userAuthService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import { checkRateLimit, getRequestRateLimitKey } from "@/utils/rateLimiter";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(
      getRequestRateLimitKey(request, "auth-refresh"),
      30,
      60 * 1000
    );

    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Too many refresh requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
      );
    }

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
