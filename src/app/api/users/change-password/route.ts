import connect from "@/db/connect";
import User from "@/models/users";
import bcryptjs from "bcryptjs";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { logUserActivity } from "@/helpers/userActivityLogger";
import { NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        await connect();
        await isAuthenticated(request);

        const userId = await getUserFromCookie(request);
        const { currentPassword, newPassword } = await request.json();

        // Validate input
        if (!currentPassword || !newPassword) {
            return Response.json(
                { error: "Current password and new password are required" },
                { status: 400 }
            );
        }

        // Validate new password strength (at least 6 characters)
        if (newPassword.length < 6) {
            return Response.json(
                { error: "New password must be at least 6 characters long" },
                { status: 400 }
            );
        }

        // Get user with current password
        const user = await User.findById(userId);
        if (!user) {
            return Response.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Verify current password
        const isCurrentPasswordValid = await bcryptjs.compare(
            currentPassword,
            user.password
        );

        if (!isCurrentPasswordValid) {
            return Response.json(
                { error: "Current password is incorrect" },
                { status: 400 }
            );
        }

        // Check if new password is different from current
        const isSamePassword = await bcryptjs.compare(newPassword, user.password);
        if (isSamePassword) {
            return Response.json(
                { error: "New password must be different from current password" },
                { status: 400 }
            );
        }

        // Hash new password
        const salt = await bcryptjs.genSalt(10);
        const hashedNewPassword = await bcryptjs.hash(newPassword, salt);

        // Update password
        await User.findByIdAndUpdate(userId, {
            password: hashedNewPassword
        });

        // Log activity
        await logUserActivity({
            targetUserId: userId,
            performedById: userId, // User changed their own password
            action: "password_change",
            details: { reason: "Self password change" },
            request
        });

        return Response.json(
            { message: "Password changed successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Password change error:", error);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}