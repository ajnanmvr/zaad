import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { UserRepository } from "@/repositories/user.repository";
import {
  hashPassword,
  comparePassword,
  validatePassword,
} from "@/utils/password.utils";
import connect from "@/db/mongo";

class AuthServiceClass {
  async signup(data: {
    username: string;
    password: string;
    role?: string;
    fullname?: string;
  }) {
    await connect();
    const { username, password, role, fullname } = data;

    // Validate inputs
    if (!username || !password) {
      throw new Error("Username and password are required");
    }

    const validation = validatePassword(password);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Check if username exists
    const existingUser = await UserRepository.findOne({ username });
    if (existingUser) {
      throw new Error("username isn't available");
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const savedUser = await UserRepository.create({
      username,
      password: hashedPassword,
      role: role || "employee",
      fullname: fullname || "",
    });

    return {
      _id: (savedUser as any)._id,
      username: (savedUser as any).username,
      role: (savedUser as any).role,
      fullname: (savedUser as any).fullname,
      createdAt: (savedUser as any).createdAt,
    };
  }

  async login(username: string, password: string) {
    await connect();
    // Validate inputs
    if (!username || !password) {
      throw new Error("Username and password are required");
    }

    // Find user
    const user = await UserRepository.findOne({ username, published: true });
    if (!user) {
      throw new Error("user isn't available");
    }

    // Verify password
    const isValid = await comparePassword(password, (user as any).password);
    if (!isValid) {
      throw new Error("Invalid Password");
    }

    // Generate JWT token
    const tokenData = {
      id: (user as any)._id,
      username: (user as any).username,
      role: (user as any).role,
    };
    const token = await jwt.sign(
      tokenData,
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    const isPartner = (user as any).role === "partner";
    return { token, isPartner };
  }

  async getCurrentUser(request: NextRequest) {
    await connect();
    const userId = await getUserFromCookie(request);
    if (!userId) return null;

    const user = await UserRepository.findOne({
      _id: userId,
      published: true,
    });
    if (!user) return null;

    return { username: (user as any).username, role: (user as any).role };
  }
}

export const AuthService = new AuthServiceClass();
