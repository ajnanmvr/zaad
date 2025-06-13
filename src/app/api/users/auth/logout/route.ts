import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = new NextResponse(
      JSON.stringify({
        message: "Logout Successful",
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
    response.cookies.set("auth", "", { httpOnly: true, expires: new Date(0) });
    response.cookies.set("partner", "", {
      httpOnly: true,
      expires: new Date(0),
    });
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { message: "Logout Failed", error },
      { status: 500 }
    );
  }
}
