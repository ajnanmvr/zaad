import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { UserRepository } from "@/repositories/user.repository";

export const AuthService = {
  async signup(data: { username: string; password: string; role?: string; fullname?: string }) {
    const { username, password, role, fullname } = data;

    if (!username || !password) {
      throw new Error("Username and password are required");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    const existingUser = await UserRepository.findOne({ username });
    if (existingUser) {
      throw new Error("username isn't available");
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

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
  },

  async login(username: string, password: string) {
    const user = await UserRepository.findOne({ username, published: true });
    if (!user) {
      throw new Error("user isn't available");
    }
    const valid = await bcryptjs.compare(password, (user as any).password);
    if (!valid) {
      throw new Error("Invalid Password");
    }

    const tokenData = {
      id: (user as any)._id,
      username: (user as any).username,
      role: (user as any).role,
    };
    const token = await jwt.sign(tokenData, process.env.JWT_SECRET as string, {
      expiresIn: "30d",
    });

    const isPartner = (user as any).role === "partner";
    return { token, isPartner };
  },

  async getCurrentUser(request: NextRequest) {
    const userId = await getUserFromCookie(request);
    if (!userId) return null;
    const user = await UserRepository.findOne({ _id: userId, published: true });
    if (!user) return null;
    return { username: (user as any).username, role: (user as any).role };
  },
};
