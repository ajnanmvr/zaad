import connect from "@/db/mongo";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { NextRequest } from "next/server";
import { UserService } from "@/services/user.service";

export async function PUT(request: NextRequest) {
    try {
        await connect();
        await isAuthenticated(request);

        const userId = await getUserFromCookie(request);
        const { currentPassword, newPassword } = await request.json();
        try {
            const result = await UserService.changePassword(userId, currentPassword, newPassword, request);
            return Response.json(result, { status: 200 });
        } catch (e) {
            const msg = (e as any).message || "Internal server error";
            const status = msg.includes("not found") ? 404 : 400;
            return Response.json({ error: msg }, { status });
        }

    } catch (error) {
        console.error("Password change error:", error);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}