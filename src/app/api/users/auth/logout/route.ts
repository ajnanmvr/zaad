import { NextRequest, NextResponse } from "next/server";
import { createLogoutResponse } from "@/services/userAuthService";

export async function GET(request: NextRequest) {
  try {
    return await createLogoutResponse(request);
  } catch (error: any) {
    return NextResponse.json(
      { message: "Logout Failed", error },
      { status: 500 }
    );
  }
}
