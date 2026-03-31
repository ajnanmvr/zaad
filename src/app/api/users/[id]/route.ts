import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { NextRequest } from "next/server";
import {
    getUserById,
    softDeleteUser,
    updateUser,
} from "@/services/userService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

// GET - Get single user by ID (partners only)
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connect();
        await requirePermission(request, "users.read");

        const { id } = params;
        const user = await getUserById(id);

        return Response.json({ user }, { status: 200 });

    } catch (error) {
        console.error("Error fetching user:", error);
        return Response.json(
            { error: getServiceErrorMessage(error, "Failed to fetch user") },
            { status: getServiceErrorStatus(error) }
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
        await requirePermission(request, "users.update");

        const { id } = params;
        const currentUserId = await getUserFromCookie(request);
        const { username, fullname, role, password } = await request.json();
        const updatedUser = await updateUser({
            id,
            currentUserId,
            username,
            fullname,
            role,
            password,
            request,
        });

        return Response.json({
            message: "User updated successfully",
            user: updatedUser
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating user:", error);
        return Response.json(
            { error: getServiceErrorMessage(error, "Failed to update user") },
            { status: getServiceErrorStatus(error) }
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
        await requirePermission(request, "users.delete");

        const { id } = params;
        const currentUserId = await getUserFromCookie(request);
        await softDeleteUser({
            id,
            currentUserId,
            request,
        });

        return Response.json({
            message: "User deleted successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Error deleting user:", error);
        return Response.json(
            { error: getServiceErrorMessage(error, "Failed to delete user") },
            { status: getServiceErrorStatus(error) }
        );
    }
}