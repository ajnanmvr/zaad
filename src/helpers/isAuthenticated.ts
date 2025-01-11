import User from "@/models/users";
import getUserFromCookie from "./getUserFromCookie";
import { NextRequest } from "next/server";

async function getUser(request: NextRequest) {
    const userId = await getUserFromCookie(request);
    if (!userId) throw new Error("No user");
    const user = await User.findOne({ _id: userId, published: true }).select("role");
    if (!user) throw new Error("User not found or not published");
    return user;
}

export async function isAuthenticated(request: NextRequest) {
    await getUser(request);
    return true;
}

export async function isPartner(request: NextRequest) {
    const user = await getUser(request);
    if (user.role !== "partner") throw new Error("User is not a partner");
    return true;
}
