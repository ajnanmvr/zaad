import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
export async function GET(request: NextRequest) {
  try {
    await connect();
    const user = await AuthService.getCurrentUser(request);
    if (!user) {
      return Response.json({ message: "No user found" }, { status: 404 });
    }
    return Response.json({ message: "found current user", user });
  } catch (error) {
    return Response.json(
      { message: "An error occurred", error },
      { status: 500 }
    );
  }
}
