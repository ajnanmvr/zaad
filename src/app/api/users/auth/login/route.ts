import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { buildLoginResponse, loginUser } from "@/services/userAuthService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
export async function POST(request: NextRequest) {
  try {
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
