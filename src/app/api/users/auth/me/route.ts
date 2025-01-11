import getUserFromCookie from "@/helpers/getUserFromCookie";
import connect from "@/db/connect";
import User from "@/models/users";
import { NextRequest } from "next/server";
export async function GET(request: NextRequest) {
  try {
    await connect();
    const userId = await getUserFromCookie(request);
    const user = await User.findOne({ _id: userId, published: true }).select(
      "username role"
    );
    if (!user) {
      throw new Error("No user found");
    }
    return Response.json({ message: "found current user", user });
  } catch (error) {
    throw new Error("No user found");
  }
}
