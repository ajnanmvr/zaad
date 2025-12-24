import connect from "@/db/mongo";
import { isPartner } from "@/helpers/isAuthenticated";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { NextRequest } from "next/server";
import { UserService } from "@/services/user.service";

// GET - Get single user by ID (partners only)
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connect();
        await isPartner(request);

        const { id } = params;
        const user = await UserService.getUser(id);

        if (!user) {
            return Response.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return Response.json({ user }, { status: 200 });

    } catch (error) {
        console.error("Error fetching user:", error);
        return Response.json(
            { error: "Failed to fetch user" },
            { status: 500 }
        );
    }
}

// PUT - Update user (partners only)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connect();
        await isPartner(request);

        const { id } = params;
        const currentUserId = await getUserFromCookie(request);
        const payload = await request.json();
        try {
            const updatedUser = await UserService.updateUser(id, payload, currentUserId, request);
            return Response.json({
                message: "User updated successfully",
                user: updatedUser
            }, { status: 200 });
        } catch (e) {
            return Response.json({ error: (e as any).message }, { status: 400 });
        }

    } catch (error) {
        console.error("Error updating user:", error);
        return Response.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}

// DELETE - Soft delete user (partners only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connect();
        await isPartner(request);

        const { id } = params;
        const currentUserId = await getUserFromCookie(request);
        try {
            await UserService.deleteUser(id, currentUserId, request);
            return Response.json({ message: "User deleted successfully" }, { status: 200 });
        } catch (e) {
            const msg = (e as any).message || "Failed to delete user";
            const status = msg.includes("not found") ? 404 : 400;
            return Response.json({ error: msg }, { status });
        }

    } catch (error) {
        console.error("Error deleting user:", error);
        return Response.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}