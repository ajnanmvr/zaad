import connect from "@/db/mongo";
import { requireAuth } from "@/auth/guards";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { NextRequest } from "next/server";
import { changeAuthenticatedUserPassword } from "@/services/userAuthService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function PUT(request: NextRequest) {
    try {
        await connect();
        await requireAuth(request);

        const userId = await getUserFromCookie(request);
        const { currentPassword, newPassword } = await request.json();

        await changeAuthenticatedUserPassword(
            userId,
            currentPassword,
            newPassword,
            request
        );

        return Response.json(
            { message: "Password changed successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Password change error:", error);
        return Response.json(
            { error: getServiceErrorMessage(error, "Internal server error") },
            { status: getServiceErrorStatus(error) }
        );
    }
}