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
    const isProduction = process.env.NODE_ENV === "production";

    response.cookies.set("auth", result.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    });

    if (result.role === "partner") {
      response.cookies.set("partner", "true", {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
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
