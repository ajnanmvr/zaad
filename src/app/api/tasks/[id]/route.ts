import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requireAnyPermission, requirePermission } from "@/auth/guards";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import Task from "@/models/tasks";
import TaskNotification from "@/models/taskNotifications";

function parseLinkedTargets(raw: unknown) {
  if (!Array.isArray(raw)) {
    return [];
  }

  const dedupe = new Set<string>();

  return raw
    .map((item) => {
      const targetType = String((item as any)?.targetType || "")
        .trim()
        .toLowerCase();
      const targetId = String((item as any)?.targetId || "").trim();
      const targetLabel = String((item as any)?.targetLabel || "").trim();

      if (!targetType || !targetId) {
        return null;
      }

      const key = `${targetType}:${targetId}`;
      if (dedupe.has(key)) {
        return null;
      }
      dedupe.add(key);

      return { targetType, targetId, targetLabel };
    })
    .filter(Boolean);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connect();
    const principal = await requireAnyPermission(request, [
      "tasks.read",
      "tasks.manage",
      "tasks.complete",
    ]);

    const task = await Task.findOne({ _id: params.id, published: true })
      .populate("assignedTo", "username fullname role")
      .populate("assignedBy", "username fullname role");

    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const canManage = principal.permissions.includes("tasks.manage");
    const isAssignee = task.assignedTo && task.assignedTo._id?.toString() === principal.userId;

    if (!canManage && !isAssignee) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json({ task }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to fetch task") },
      { status: getServiceErrorStatus(error) },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connect();
    const principal = await requireAnyPermission(request, [
      "tasks.manage",
      "tasks.complete",
    ]);

    const existing = await Task.findOne({ _id: params.id, published: true });
    if (!existing) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const canManage = principal.permissions.includes("tasks.manage");
    const isAssignee = existing.assignedTo?.toString() === principal.userId;

    if (!canManage && !isAssignee) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const update: Record<string, any> = {};

    if (canManage) {
      if (body.title !== undefined) update.title = String(body.title || "").trim();
      if (body.description !== undefined) update.description = String(body.description || "").trim();
      if (body.priority !== undefined) update.priority = body.priority;
      if (body.status !== undefined) update.status = body.status;
      if (body.assignedTo !== undefined) update.assignedTo = body.assignedTo;
      if (body.dueDate !== undefined) update.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      if (body.completionNote !== undefined) update.completionNote = String(body.completionNote || "");
      if (body.linkedTargets !== undefined) {
        update.linkedTargets = parseLinkedTargets(body.linkedTargets);
      }

      if (body.status === "completed") {
        update.completedAt = new Date();
      }
    } else {
      if (body.status && ["in_progress", "completed"].includes(body.status)) {
        update.status = body.status;
      }
      if (body.completionNote !== undefined) {
        update.completionNote = String(body.completionNote || "").trim();
      }
      if (body.status === "completed") {
        update.completedAt = new Date();
      }
    }

    const updated = await Task.findByIdAndUpdate(existing._id, update, { new: true })
      .populate("assignedTo", "username fullname role")
      .populate("assignedBy", "username fullname role");

    if (updated && update.assignedTo && String(update.assignedTo) !== existing.assignedTo.toString()) {
      await TaskNotification.create({
        user: update.assignedTo,
        task: updated._id,
        type: "assigned",
        title: "Task Reassigned",
        message: `You were assigned: ${updated.title}`,
        createdBy: principal.userId,
      });
    }

    if (updated && update.status === "completed" && existing.assignedBy.toString() !== principal.userId) {
      await TaskNotification.create({
        user: existing.assignedBy,
        task: updated._id,
        type: "completed",
        title: "Task Completed",
        message: `${principal.username} completed: ${updated.title}`,
        createdBy: principal.userId,
      });
    }

    return Response.json({ message: "Task updated", task: updated }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to update task") },
      { status: getServiceErrorStatus(error) },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connect();
    await requirePermission(request, "tasks.manage");

    const task = await Task.findOne({ _id: params.id, published: true });
    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    await Task.findByIdAndUpdate(task._id, { published: false });
    return Response.json({ message: "Task deleted" }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to delete task") },
      { status: getServiceErrorStatus(error) },
    );
  }
}
