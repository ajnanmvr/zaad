import connect from "@/db/mongo";
import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
export async function POST(request: NextRequest) {
  try {
    await connect();
    const { username, password } = await request.json();
    try {
      const { token, isPartner } = await AuthService.login(username, password);
      const response = NextResponse.json({
        message: "Login successfull",
        success: true,
      });
      response.cookies.set("auth", token, {
        httpOnly: true,
        secure: true,
      });
      if (isPartner) {
        response.cookies.set("partner", "true", {
          httpOnly: true,
          secure: true,
        });
      }
      return response;
    } catch (err: any) {
      const msg = err?.message || "Login failed";
      const status = msg.includes("Invalid") || msg.includes("available") ? 400 : 500;
      return Response.json({ message: msg }, { status });
    }
  } catch (error) {
    return Response.json(
      { message: "error while logging in", error },
      { status: 400 }
    );
  }
}
