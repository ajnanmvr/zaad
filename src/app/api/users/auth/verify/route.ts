import connect from "@/db/connect";
import User from "@/models/users";
connect();
export async function POST(request: Request) {
  try {
    const { token }: { token: string } = await request.json();
    const user = await User.findOne({
      verifyToken: token,
      verifyTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return Response.json({ message: "Invalid Token" }, { status: 400 });
    }
    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;
    await user.save();
    return Response.json(
      { message: "Email Verified Successfully", success: true },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { message: "can't verify user email", error },
      { status: 500 }
    );
  }
}
