import { NextResponse } from "next/server";
export async function GET() {
  try {
    const response = NextResponse.json({
      message: "Logout Successful",
      success: true,
    });
    response.cookies.set("auth", "", { httpOnly: true, expires: new Date(0) });
    response.cookies.set("partner", "", { httpOnly: true, expires: new Date(0) });
    return response;
  } catch (error: any) {
    return Response.json({ message: "Logout Failed", error }, { status: 500 });
  }
}
