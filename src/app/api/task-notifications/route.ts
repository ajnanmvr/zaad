import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requireAnyPermission } from "@/auth/guards";
import TaskNotification from "@/models/taskNotifications";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function GET(request: NextRequest) {
  try {
    await connect();
    const principal = await requireAnyPermission(request, [
      "tasks.notifications.read",
      "tasks.read",
      "tasks.manage",
    ]);

    const params = request.nextUrl.searchParams;
    const unreadOnly = params.get("unread") === "true";
    const limit = Number(params.get("limit") || "12");

    const query: Record<string, any> = { user: principal.userId };
    if (unreadOnly) query.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      TaskNotification.find(query)
        .populate("task", "title status dueDate")
        .sort({ createdAt: -1 })
        .limit(limit),
      TaskNotification.countDocuments({ user: principal.userId, isRead: false }),
    ]);

    return Response.json({ notifications, unreadCount }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to fetch notifications") },
      { status: getServiceErrorStatus(error) },
    );
  }
}
