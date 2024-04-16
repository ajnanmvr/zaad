import { mailer } from "@/helpers/mailer";
import connect from "@/db/connect";
import User from "@/models/users";
import bcryptjs from "bcryptjs";
import { type TUser } from "@/libs/types";
connect();
export async function POST(request: Request) {
  try {
    const { username, email, password }: TUser = await request.json();
    const existingEmail: TUser | null = await User.findOne({ email });
    if (existingEmail) {
      return Response.json(
        { error: "Email already Registered" },
        { status: 400 }
      );
    }
    const existingUserName: TUser | null = await User.findOne({ username });
    if (existingUserName) {
      return Response.json(
        { error: "username isn't available" },
        { status: 400 }
      );
    }
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    const newUser = new User({ username, email, password: hashedPassword });
    const savedUser = await newUser.save();

    await mailer({
      email,
      userId: savedUser._id,
      reason: "VERIFY",
    });

    return Response.json(
      { message: "User Created Successfully", success: true, savedUser },
      { status: 201 }
    );
  } catch (error) {
    return Response.json({ message: "error while creating user", error });
  }
}
