import connect from "@/db/mongo";
import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/services/userAuthService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
export async function POST(request: NextRequest) {
  try {
    await connect();
    const reqBody = await request.json();
    const { username, password } = reqBody;
    const result = await loginUser(username, password);

    const response = NextResponse.json({
      message: "Login successfull",
      success: true,
    });
    response.cookies.set("auth", result.token, {
      httpOnly: true,
      secure: true,
    });

    if (result.role === "partner") {
      response.cookies.set("partner", "true", {
        httpOnly: true,
        secure: true,
      });
    }
    return response;
  } catch (error) {
    return Response.json({
      error: getServiceErrorMessage(error, "error while logging in"),
    }, {
      status: getServiceErrorStatus(error),
    });
  }
}
