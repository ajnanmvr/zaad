import getUserFromCookie from "@/helpers/getUserFromCookie";
import connect from "@/db/connect";
import User from "@/models/users";
import { NextRequest } from "next/server";
connect();
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromCookie(request);
    const user = await User.findOne({ _id: userId,published:true }).select(
      "username role"
    );
    return Response.json({ message: "found current user", user });
  } catch (error) {
    return Response.json({ message: "can't get logged user details", error },{status:400});
  }
}
