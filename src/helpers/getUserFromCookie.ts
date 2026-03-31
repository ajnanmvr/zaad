import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
const getUserFromCookie = (request: NextRequest) => {
  try {
    const token = request.cookies.get("auth")?.value || "";
    const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET!);

    if (decodedToken?.tokenType && decodedToken.tokenType !== "access") {
      throw new Error("Invalid token type");
    }

    return decodedToken.id;
  } catch (error: any) {
    throw new Error(error);
  }
};
export default getUserFromCookie;
