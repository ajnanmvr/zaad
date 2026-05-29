import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requireAnyPermission, requirePermission } from "@/auth/guards";
import { hasPermission } from "@/auth/permissions";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import Task from "@/models/tasks";
import TaskNotification from "@/models/taskNotifications";

const ALLOWED_LINK_TARGET_TYPES = new Set(["company", "employee", "individual"]);

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

      if (!targetType || !targetId || !ALLOWED_LINK_TARGET_TYPES.has(targetType)) {
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

function normalizeTaskCategory(raw: unknown): "visa" | "license" | "other" | null {
  const value = String(raw || "")
    .trim()
    .toLowerCase();

  if (value === "visa") return "visa";
  if (value === "license") return "license";
  if (value === "other") return "other";
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connect();
    const principal = await requireAnyPermission(request, [
      "tasks.view.my",
      "tasks.view.all",
      "tasks.view.detail",
      "tasks.read",
      "tasks.manage",
      "tasks.complete",
    ]);

    const task = await Task.findOne({ _id: params.id, published: true })
      .populate("assignedTo", "username fullname role")
      .populate("assignedBy", "username fullname role")
      .populate("taskHistory.changedBy", "username fullname role");

    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const canViewAll = hasPermission(principal.permissions, "tasks.view.all");
    const isAssignee = task.assignedTo && task.assignedTo._id?.toString() === principal.userId;

    if (!canViewAll && !isAssignee) {
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
      "tasks.update",
      "tasks.manage",
      "tasks.complete",
    ]);

    const existing = await Task.findOne({ _id: params.id, published: true });
    if (!existing) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const canUpdateTask = hasPermission(principal.permissions, "tasks.update");
    const canAssignTask = hasPermission(principal.permissions, "tasks.assign");
    const isAssignee = existing.assignedTo?.toString() === principal.userId;

    if (!canUpdateTask && !isAssignee) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const update: Record<string, any> = {};

    if (canUpdateTask) {
      if (body.title !== undefined) update.title = String(body.title || "").trim();
      if (body.description !== undefined) update.description = String(body.description || "").trim();
      if (body.priority !== undefined) update.priority = body.priority;
      if (body.category !== undefined) {
        const normalizedCategory = normalizeTaskCategory(body.category);
        update.category = normalizedCategory || undefined;
      }
      if (body.status !== undefined) update.status = body.status;
      if (body.assignedTo !== undefined) {
        if (!canAssignTask && String(body.assignedTo) !== existing.assignedTo.toString()) {
          return Response.json(
            { error: "Missing permission: tasks.assign" },
            { status: 403 },
          );
        }

        update.assignedTo = body.assignedTo;
      }
      if (body.dueDate !== undefined) update.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      if (body.completionNote !== undefined) update.completionNote = String(body.completionNote || "");
      if (body.cancellationNote !== undefined) {
        update.cancellationNote = String(body.cancellationNote || "");
      }
      if (body.linkedTargets !== undefined) {
        update.linkedTargets = parseLinkedTargets(body.linkedTargets);
      }
    } else {
      if (body.status && ["in_progress", "completed", "cancelled"].includes(body.status)) {
        update.status = body.status;
      }
      if (body.completionNote !== undefined) {
        update.completionNote = String(body.completionNote || "").trim();
      }
      if (body.cancellationNote !== undefined) {
        update.cancellationNote = String(body.cancellationNote || "").trim();
      }
    }

    const previousStatus = String(existing.status || "todo");
    const nextStatus = String(update.status || previousStatus);

    if (nextStatus === "completed") {
      update.completedAt = new Date();
    } else if (update.status !== undefined) {
      update.completedAt = null;
    }

    const shouldRecordStatusHistory = update.status !== undefined && previousStatus !== nextStatus;
    const statusHistoryEntry = shouldRecordStatusHistory
      ? {
          action: nextStatus,
          status: nextStatus,
          note:
            nextStatus === "completed"
              ? String(update.completionNote || body.completionNote || "").trim()
              : nextStatus === "cancelled"
                ? String(update.cancellationNote || body.cancellationNote || "").trim()
                : "",
          changedBy: principal.userId,
          changedAt: new Date(),
        }
      : null;

    const updatePayload = statusHistoryEntry
      ? { $set: update, $push: { taskHistory: statusHistoryEntry } }
      : { $set: update };

    const updated = await Task.findByIdAndUpdate(existing._id, updatePayload, { new: true })
      .populate("assignedTo", "username fullname role")
      .populate("assignedBy", "username fullname role")
      .populate("taskHistory.changedBy", "username fullname role");

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
    await requireAnyPermission(request, ["tasks.delete", "tasks.manage"]);

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
