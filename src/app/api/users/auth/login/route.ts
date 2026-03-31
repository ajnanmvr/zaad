import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { buildLoginResponse, loginUser } from "@/services/userAuthService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import { checkRateLimit, getRequestRateLimitKey } from "@/utils/rateLimiter";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(
      getRequestRateLimitKey(request, "auth-login"),
      10,
      5 * 60 * 1000,
      { failOpen: false }
    );

    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Authentication service temporarily unavailable or rate limited." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
      );
    }

    await connect();
    const reqBody = await request.json();
    const { username, password } = reqBody;
    const result = await loginUser(username, password, request);

    return buildLoginResponse(result.tokens, result.role);
  } catch (error) {
    return Response.json({
      error: getServiceErrorMessage(error, "error while logging in"),
    }, {
      status: getServiceErrorStatus(error),
    });
  }
}
