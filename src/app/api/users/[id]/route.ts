import connect from "@/db/connect";
import User from "@/models/users";
import bcryptjs from "bcryptjs";
import { isPartner } from "@/helpers/isAuthenticated";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { logUserActivity } from "@/helpers/userActivityLogger";
import { NextRequest } from "next/server";

// GET - Get single user by ID (partners only)
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connect();
        await isPartner(request);

        const { id } = params;

        // Allow viewing both published and unpublished (deleted) users
        const user = await User.findById(id)
            .select("username fullname role createdAt updatedAt published deletedAt");

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
        const { username, fullname, role, password } = await request.json();

        // Check if user exists
        const existingUser = await User.findOne({ _id: id, published: true });
        if (!existingUser) {
            return Response.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Prevent partners from demoting themselves
        if (id === currentUserId && role === "employee") {
            return Response.json(
                { error: "You cannot change your own role from partner to employee" },
                { status: 400 }
            );
        }

        // Prevent partners from demoting other partners to employee
        if (role === "employee" && existingUser.role === "partner" && id !== currentUserId) {
            return Response.json(
                { error: "Partners cannot downgrade other partners to employee role" },
                { status: 403 }
            );
        }

        // Prevent partners from changing passwords of other partners
        if (password && existingUser.role === "partner" && id !== currentUserId) {
            return Response.json(
                { error: "Partners cannot change passwords of other partners" },
                { status: 403 }
            );
        }

        // Check if new username already exists (if username is being changed)
        if (username && username !== existingUser.username) {
            const usernameExists = await User.findOne({
                username,
                published: true,
                _id: { $ne: id }
            });
            if (usernameExists) {
                return Response.json(
                    { error: "Username already exists" },
                    { status: 400 }
                );
            }
        }

        // Store previous values for activity logging
        const previousValues: any = {};
        if (username && username !== existingUser.username) previousValues.username = existingUser.username;
        if (fullname !== undefined && fullname !== existingUser.fullname) previousValues.fullname = existingUser.fullname;
        if (role && role !== existingUser.role) previousValues.role = existingUser.role;
        if (password) previousValues.passwordChanged = true;

        // Prepare update data
        const updateData: any = {};
        const newValues: any = {};
        if (username) {
            updateData.username = username;
            newValues.username = username;
        }
        if (fullname !== undefined) {
            updateData.fullname = fullname;
            newValues.fullname = fullname;
        }
        if (role) {
            updateData.role = role;
            newValues.role = role;
        }

        // Handle password update if provided
        if (password) {
            if (password.length < 6) {
                return Response.json(
                    { error: "Password must be at least 6 characters long" },
                    { status: 400 }
                );
            }
            const salt = await bcryptjs.genSalt(10);
            updateData.password = await bcryptjs.hash(password, salt);
            newValues.passwordChanged = true;
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).select("username fullname role createdAt updatedAt");

        // Log activity
        if (Object.keys(previousValues).length > 0) {
            const action = password ? "password_change" : (role && role !== existingUser.role) ? "role_change" : "update";
            await logUserActivity({
                targetUserId: id,
                performedById: currentUserId,
                action,
                previousValues,
                newValues,
                request
            });
        }

        return Response.json({
            message: "User updated successfully",
            user: updatedUser
        }, { status: 200 });

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

        // Prevent partners from deleting themselves
        if (id === currentUserId) {
            return Response.json(
                { error: "You cannot delete your own account" },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await User.findOne({ _id: id, published: true });
        if (!user) {
            return Response.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Soft delete user
        await User.findByIdAndUpdate(id, {
            published: false,
            deletedAt: new Date()
        });

        // Log activity
        await logUserActivity({
            targetUserId: id,
            performedById: currentUserId,
            action: "delete",
            details: { reason: "User soft deleted" },
            previousValues: { published: true },
            newValues: { published: false },
            request
        });

        return Response.json({
            message: "User deleted successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Error deleting user:", error);
        return Response.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}