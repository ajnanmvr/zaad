import UserActivity from "@/models/userActivity";
import { NextRequest } from "next/server";

export interface LogUserActivityOptions {
    targetUserId: string;
    performedById: string;
    action: "create" | "update" | "delete" | "password_change" | "role_change" | "reactivate";
    details?: Record<string, any>;
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
    request?: NextRequest;
}

export async function logUserActivity(options: LogUserActivityOptions) {
    try {
        const {
            targetUserId,
            performedById,
            action,
            details = {},
            previousValues = {},
            newValues = {},
            request
        } = options;

        let ipAddress = "";
        let userAgent = "";

        if (request) {
            // Get IP address
            ipAddress = request.headers.get("x-forwarded-for") ||
                request.headers.get("x-real-ip") ||
                "";

            // Get user agent
            userAgent = request.headers.get("user-agent") || "";
        }

        await UserActivity.create({
            targetUser: targetUserId,
            performedBy: performedById,
            action,
            details,
            previousValues,
            newValues,
            ipAddress,
            userAgent,
        });

    } catch (error) {
        console.error("Error logging user activity:", error);
        // Don't throw error to prevent breaking the main operation
    }
}

export async function getUserActivityHistory(
    userId: string,
    page: number = 0,
    limit: number = 10
) {
    try {
        const skip = page * limit;

        const activities = await UserActivity.find({ targetUser: userId })
            .populate("performedBy", "username fullname")
            .populate("targetUser", "username fullname")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await UserActivity.countDocuments({ targetUser: userId });

        return {
            activities,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalActivities: total,
                hasMore: (page + 1) * limit < total
            }
        };

    } catch (error) {
        console.error("Error fetching user activity history:", error);
        throw error;
    }
}