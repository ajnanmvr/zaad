import connect from "@/db/mongo";
import { isPartner } from "@/helpers/isAuthenticated";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { NextRequest } from "next/server";
import { UserService } from "@/services/user.service";

// PUT - Reactivate (restore) soft-deleted user (partners only)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connect();
        await isPartner(request);

        const { id } = params;
        const currentUserId = await getUserFromCookie(request);
        try {
            const user = await UserService.reactivateUser(id, currentUserId, request);
            return Response.json({
                message: `User '${user.username}' has been reactivated successfully`,
                user,
            }, { status: 200 });
        } catch (e) {
            const msg = (e as any).message || "Failed to reactivate user";
            const status = msg.includes("not found") ? 404 : 400;
            return Response.json({ error: msg }, { status });
        }

    } catch (error) {
        console.error("Error reactivating user:", error);
        return Response.json(
            { error: "Failed to reactivate user" },
            { status: 500 }
        );
    }
}
