import connect from "@/db/mongo";
import User from "@/models/users";
import { isPartner } from "@/helpers/isAuthenticated";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { logUserActivity } from "@/helpers/userActivityLogger";
import { NextRequest } from "next/server";

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

        // Check if user exists and is soft-deleted
        const user = await User.findOne({ _id: id, published: false })
            .select("username fullname role createdAt");

        if (!user) {
            return Response.json(
                { error: "Deleted user not found" },
                { status: 404 }
            );
        }

        // Check if username conflicts with an active user
        const existingActiveUser = await User.findOne({
            username: user.username,
            published: true,
            _id: { $ne: id }
        });

        if (existingActiveUser) {
            return Response.json(
                { error: `Cannot reactivate user. Username '${user.username}' is already taken by an active user.` },
                { status: 400 }
            );
        }

        // Reactivate user
        await User.findByIdAndUpdate(id, {
            published: true,
            deletedAt: null
        });

        // Log activity
        await logUserActivity({
            targetUserId: id,
            performedById: currentUserId,
            action: "reactivate",
            details: { reason: "User reactivated from deleted state" },
            previousValues: { published: false },
            newValues: { published: true },
            request
        });

        return Response.json({
            message: `User '${user.username}' has been reactivated successfully`,
            user: {
                _id: user._id,
                username: user.username,
                fullname: user.fullname,
                role: user.role,
                createdAt: user.createdAt
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Error reactivating user:", error);
        return Response.json(
            { error: "Failed to reactivate user" },
            { status: 500 }
        );
    }
}
