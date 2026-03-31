import User from "@/models/users";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { logUserActivity } from "@/helpers/userActivityLogger";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { TUser } from "@/types/types";
import { ServiceError } from "./serviceError";

type TAuthPayload = {
  id: string;
  username: string;
  role: "partner" | "employee";
};

function createAuthToken(payload: TAuthPayload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new ServiceError("Missing JWT secret", 500);
  }

  return jwt.sign(payload, secret, { expiresIn: "30d" });
}

export async function loginUser(username?: string, password?: string) {
  if (!username || !password) {
    throw new ServiceError("Username and password are required", 400);
  }

  const existingUser = await User.findOne({ username, published: true });
  if (!existingUser) {
    throw new ServiceError("user isn't available", 400);
  }

  const validPassword = await bcryptjs.compare(password, existingUser.password);
  if (!validPassword) {
    throw new ServiceError("Invalid Password", 400);
  }

  const token = createAuthToken({
    id: existingUser._id.toString(),
    username: existingUser.username,
    role: existingUser.role,
  });

  return {
    token,
    role: existingUser.role,
  };
}

export async function getCurrentUserFromRequest(request: NextRequest) {
  const userId = await getUserFromCookie(request);
  const user = await User.findOne({ _id: userId, published: true }).select(
    "username role"
  );

  if (!user) {
    throw new ServiceError("No user found", 404);
  }

  return user;
}

export async function signupUser(payload: TUser) {
  const { username, password, role, fullname } = payload;

  if (!username || !password) {
    throw new ServiceError("Username and password are required", 400);
  }

  const existingUserName: TUser | null = await User.findOne({ username });
  if (existingUserName) {
    throw new ServiceError("username isn't available", 400);
  }

  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);

  const newUser = new User({
    username,
    password: hashedPassword,
    role,
    fullname,
  });

  return newUser.save();
}

export function createLogoutResponse() {
  const response = new NextResponse(
    JSON.stringify({
      message: "Logout Successful",
      success: true,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );

  response.cookies.set("auth", "", { httpOnly: true, expires: new Date(0) });
  response.cookies.set("partner", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  return response;
}

export async function changeAuthenticatedUserPassword(
  userId: string,
  currentPassword?: string,
  newPassword?: string,
  request?: NextRequest
) {
  if (!currentPassword || !newPassword) {
    throw new ServiceError("Current password and new password are required", 400);
  }

  if (newPassword.length < 6) {
    throw new ServiceError("New password must be at least 6 characters long", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ServiceError("User not found", 404);
  }

  const isCurrentPasswordValid = await bcryptjs.compare(
    currentPassword,
    user.password
  );

  if (!isCurrentPasswordValid) {
    throw new ServiceError("Current password is incorrect", 400);
  }

  const isSamePassword = await bcryptjs.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new ServiceError(
      "New password must be different from current password",
      400
    );
  }

  const salt = await bcryptjs.genSalt(10);
  const hashedNewPassword = await bcryptjs.hash(newPassword, salt);

  await User.findByIdAndUpdate(userId, {
    password: hashedNewPassword,
  });

  await logUserActivity({
    targetUserId: userId,
    performedById: userId,
    action: "password_change",
    details: { reason: "Self password change" },
    request,
  });
}
