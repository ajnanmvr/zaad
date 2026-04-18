import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requireAnyPermission } from "@/auth/guards";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import Task from "@/models/tasks";
import TaskNotification from "@/models/taskNotifications";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connect();
    const principal = await requireAnyPermission(request, [
      "tasks.complete",
      "tasks.manage",
    ]);

    const body = await request.json();
    const note = String(body?.completionNote || "").trim();

    const task = await Task.findOne({ _id: params.id, published: true });
    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const canManage = principal.permissions.includes("tasks.manage");
    const isAssignee = task.assignedTo.toString() === principal.userId;

    if (!canManage && !isAssignee) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    task.status = "completed";
    task.completedAt = new Date();
    if (note) task.completionNote = note;
    await task.save();

    if (task.assignedBy.toString() !== principal.userId) {
      await TaskNotification.create({
        user: task.assignedBy,
        task: task._id,
        type: "completed",
        title: "Task Completed",
        message: `${principal.username} completed: ${task.title}`,
        createdBy: principal.userId,
      });
    }

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "username fullname role")
      .populate("assignedBy", "username fullname role");

    return Response.json({ message: "Task completed", task: populated }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to complete task") },
      { status: getServiceErrorStatus(error) },
    );
  }
}
