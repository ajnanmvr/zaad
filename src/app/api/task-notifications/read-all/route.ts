import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requireAnyPermission } from "@/auth/guards";
import TaskNotification from "@/models/taskNotifications";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function PATCH(request: NextRequest) {
  try {
    await connect();
    const principal = await requireAnyPermission(request, [
      "tasks.notifications.read",
      "tasks.read",
      "tasks.manage",
    ]);

    await TaskNotification.updateMany(
      { user: principal.userId, isRead: false },
      { isRead: true },
    );

    return Response.json({ message: "All notifications marked as read" }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to update notifications") },
      { status: getServiceErrorStatus(error) },
    );
  }
}
