import connect from "@/db/connect";
import User from "@/models/users";
import bcryptjs from "bcryptjs";
import { type TUser } from "@/types/types";
connect();
export async function POST(request: Request) {
  try {
    const { username, password,role }: TUser = await request.json();

    const existingUserName: TUser | null = await User.findOne({ username });
    if (existingUserName) {
      return Response.json(
        { error: "username isn't available" },
        { status: 400 }
      );
    }
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword= await bcryptjs.hash(password!, salt);
    const newUser = new User({ username, password: hashedPassword ,role});
    const savedUser = await newUser.save();

    return Response.json(
      { message: "User Created Successfully", success: true, savedUser },
      { status: 201 }
    );
  } catch (error) {
    return Response.json({ message: "error while creating user", error });
  }
}
