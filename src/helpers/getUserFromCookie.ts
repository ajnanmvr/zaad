import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
const getUserFromCookie = (request: NextRequest) => {
  try {
    const token = request.cookies.get("token")?.value || "";
    const { id, username }: any = jwt.verify(token, process.env.JWT_SECRET!);
    return { id, username };
  } catch (error: any) {
    throw new Error(error);
  }
};
export default getUserFromCookie;
