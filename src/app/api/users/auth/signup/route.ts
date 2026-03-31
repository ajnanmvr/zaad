import connect from "@/db/mongo";
import { type TUser } from "@/types/types";
import { NextRequest } from "next/server";
import { signupUser } from "@/services/userAuthService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
export async function POST(request: NextRequest) {
  try {
    await connect();

    const payload: TUser = await request.json();
    const savedUser = await signupUser(payload);

    return Response.json(
      { message: "User Created Successfully", success: true, savedUser },
      { status: 201 }
    );
  } catch (error) {
    return Response.json({
      error: getServiceErrorMessage(error, "error while creating user"),
    }, {
      status: getServiceErrorStatus(error),
    });
  }
}
