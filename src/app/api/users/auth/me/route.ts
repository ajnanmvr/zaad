import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { getCurrentUserFromRequest } from "@/services/userAuthService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
export async function GET(request: NextRequest) {
  try {
    await connect();
    const user = await getCurrentUserFromRequest(request);

    return Response.json({ message: "found current user", user });
  } catch (error) {
    return Response.json({
      message: getServiceErrorMessage(error, "An error occurred"),
    }, {
      status: getServiceErrorStatus(error),
    });
  }
}

