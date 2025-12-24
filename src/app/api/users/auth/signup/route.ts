import connect from "@/db/mongo";
import { type TUser } from "@/types/types";
import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
export async function POST(request: NextRequest) {
  try {
    await connect();
    const payload: TUser = await request.json();
    try {
      const savedUser = await AuthService.signup({
        username: payload.username!,
        password: payload.password!,
        role: payload.role,
        fullname: payload.fullname,
      });
      return Response.json(
        { message: "User Created Successfully", success: true, savedUser },
        { status: 201 }
      );
    } catch (err: any) {
      const msg = err?.message || "Signup failed";
      const status = msg.includes("available") || msg.includes("required") || msg.includes("characters") ? 400 : 500;
      return Response.json({ error: msg }, { status });
    }
  } catch (error) {
    return Response.json({ message: "error while creating user", error });
  }
}
