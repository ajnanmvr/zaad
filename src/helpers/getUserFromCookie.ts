import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
const getUserFromCookie = (request: NextRequest) => {
  try {
    const token = request.cookies.get("token")?.value || "";
    const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET!);
    return decodedToken.id;
  } catch (error: any) {
    throw new Error(error);
  }
};
export default getUserFromCookie;
