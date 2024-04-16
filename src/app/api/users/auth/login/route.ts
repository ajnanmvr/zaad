import connect from "@/db/connect";
import User from "@/models/users";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

connect();
export async function POST(request: Request) {
  try {
    const reqBody = await request.json();
    const { username, password } = reqBody;
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      return Response.json({ error: "user isn't available" }, { status: 400 });
    }
    const validPassword = await bcryptjs.compare(
      password,
      existingUser.password
    );
    if (!validPassword) {
      return Response.json({ message: "Invalid Password" }, { status: 400 });
    }
    const tokenData = {
      id: existingUser._id,
      username: existingUser.username,
      email: existingUser.email,
    };
    const token = await jwt.sign(tokenData, process.env.JWT_SECRET!, {
      expiresIn: "30d",
    });
    const response = NextResponse.json({
      message: "Login successfull",
      success: true,
    });
    response.cookies.set("auth", token, {
      httpOnly: true,secure:true
    });
    return response;
  } catch (error) {
    return Response.json({ message: "error while logging in", error },{status:400});
  }
}
