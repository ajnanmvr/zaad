import { NextResponse } from "next/server";
import { createLogoutResponse } from "@/services/userAuthService";

export async function GET() {
  try {
    return createLogoutResponse();
  } catch (error: any) {
    return NextResponse.json(
      { message: "Logout Failed", error },
      { status: 500 }
    );
  }
}
