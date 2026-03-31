import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { NextRequest } from "next/server";
import { reactivateUser } from "@/services/userService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

// PUT - Reactivate (restore) soft-deleted user (partners only)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connect();
        await requirePermission(request, "users.reactivate");

        const { id } = params;
        const currentUserId = await getUserFromCookie(request);
        const user = await reactivateUser({
            id,
            currentUserId,
            request,
        });

        return Response.json({
            message: `User '${user.username}' has been reactivated successfully`,
            user
        }, { status: 200 });

    } catch (error) {
        console.error("Error reactivating user:", error);
        return Response.json(
            { error: getServiceErrorMessage(error, "Failed to reactivate user") },
            { status: getServiceErrorStatus(error) }
        );
    }
}
