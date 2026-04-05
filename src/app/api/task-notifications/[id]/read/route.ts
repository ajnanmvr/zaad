import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requireAnyPermission } from "@/auth/guards";
import TaskNotification from "@/models/taskNotifications";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connect();
    const principal = await requireAnyPermission(request, [
      "tasks.notifications.read",
      "tasks.read",
      "tasks.manage",
    ]);

    const notification = await TaskNotification.findOne({
      _id: params.id,
      user: principal.userId,
    });

    if (!notification) {
      return Response.json({ error: "Notification not found" }, { status: 404 });
    }

    notification.isRead = true;
    await notification.save();

    return Response.json({ message: "Notification marked as read" }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to update notification") },
      { status: getServiceErrorStatus(error) },
    );
  }
}
