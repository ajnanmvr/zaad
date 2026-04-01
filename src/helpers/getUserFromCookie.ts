import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { ServiceError } from "@/services/serviceError";

const getUserFromCookie = (request: NextRequest) => {
  try {
    const token = request.cookies.get("auth")?.value || "";
    if (!token) {
      throw new ServiceError("Invalid or missing auth token", 401);
    }

    const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET!);

    if (decodedToken?.tokenType && decodedToken.tokenType !== "access") {
      throw new ServiceError("Invalid token type", 401);
    }

    return decodedToken.id;
  } catch (error: any) {
    if (error instanceof ServiceError) {
      throw error;
    }

    throw new ServiceError("Invalid or missing auth token", 401);
  }
};
export default getUserFromCookie;
