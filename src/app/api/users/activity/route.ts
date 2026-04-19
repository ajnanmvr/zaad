import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import UserActivity from "@/models/userActivity";
import { PAGINATION } from "@/config/pagination";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "users.activity.read");

    const params = request.nextUrl.searchParams;
    const page = Number(params.get("page") || 0);
    const limit = Number(params.get("limit") || PAGINATION.LIMITS.USER_ACTIVITY);
    const action = params.get("action") || "";
    const userId = params.get("userId") || "";

    const query: Record<string, unknown> = {};
    if (action) {
      query.action = action;
    }
    if (userId) {
      query.$or = [{ targetUser: userId }, { performedBy: userId }];
    }

    const [activities, total] = await Promise.all([
      UserActivity.find(query)
        .populate("targetUser", "username fullname role")
        .populate("performedBy", "username fullname role")
        .sort({ createdAt: -1 })
        .skip(page * limit)
        .limit(limit),
      UserActivity.countDocuments(query),
    ]);

    return Response.json(
      {
        activities,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalActivities: total,
          hasMore: (page + 1) * limit < total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const status = getServiceErrorStatus(error);
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to fetch activity audit logs") },
      { status }
    );
  }
}


