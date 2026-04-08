import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requireAnyPermission, requirePermission } from "@/auth/guards";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import Task from "@/models/tasks";
import TaskNotification from "@/models/taskNotifications";

export async function GET(request: NextRequest) {
  try {
    await connect();
    const principal = await requireAnyPermission(request, [
      "tasks.read",
      "tasks.manage",
      "tasks.complete",
    ]);

    const params = request.nextUrl.searchParams;
    const scope = params.get("scope") || "mine";
    const status = params.get("status") || "";
    const priority = params.get("priority") || "";
    const assignee = params.get("assignee") || "";
    const search = params.get("search") || "";
    const date = params.get("date") || "";
    const page = Number(params.get("page") || "0");
    const limit = Number(params.get("limit") || "20");

    const query: Record<string, any> = { published: true };

    const canManage = principal.permissions.includes("tasks.manage");
    if (scope === "mine" || !canManage) {
      query.assignedTo = principal.userId;
    } else if (assignee) {
      query.assignedTo = assignee;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (date) {
      const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
      if (!isValidDate) {
        return Response.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
      }

      const start = new Date(`${date}T00:00:00`);
      if (Number.isNaN(start.getTime())) {
        return Response.json({ error: "Invalid date provided." }, { status: 400 });
      }

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      query.dueDate = { $gte: start, $lt: end };
    }

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate("assignedTo", "username fullname role")
        .populate("assignedBy", "username fullname role")
        .sort({ status: 1, priority: -1, dueDate: 1, createdAt: -1 })
        .skip(page * limit)
        .limit(limit),
      Task.countDocuments(query),
    ]);

    return Response.json(
      {
        tasks,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalTasks: total,
          hasMore: (page + 1) * limit < total,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to fetch tasks") },
      { status: getServiceErrorStatus(error) },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connect();
    const principal = await requirePermission(request, "tasks.manage");

    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
    }: {
      title?: string;
      description?: string;
      priority?: "low" | "medium" | "high" | "urgent";
      dueDate?: string | null;
      assignedTo?: string;
    } = await request.json();

    if (!title?.trim()) {
      return Response.json({ error: "Task title is required" }, { status: 400 });
    }

    if (!assignedTo) {
      return Response.json({ error: "Assignee is required" }, { status: 400 });
    }

    const task = await Task.create({
      title: title.trim(),
      description: (description || "").trim(),
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedTo,
      assignedBy: principal.userId,
      status: "todo",
      published: true,
    });

    await TaskNotification.create({
      user: assignedTo,
      task: task._id,
      type: "assigned",
      title: "New Task Assigned",
      message: `You were assigned: ${task.title}`,
      createdBy: principal.userId,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "username fullname role")
      .populate("assignedBy", "username fullname role");

    return Response.json({ message: "Task created", task: populatedTask }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to create task") },
      { status: getServiceErrorStatus(error) },
    );
  }
}
