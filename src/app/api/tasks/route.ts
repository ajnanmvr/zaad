import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { requireAnyPermission, requirePermission } from "@/auth/guards";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import Task from "@/models/tasks";
import TaskNotification from "@/models/taskNotifications";
import Company from "@/models/companies";
import Employee from "@/models/employees";
import Individual from "@/models/individuals";

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

function normalizeTaskCategory(raw: unknown): "visa" | "license" | "other" | undefined {
  const value = String(raw || "")
    .trim()
    .toLowerCase();

  if (value === "visa") return "visa";
  if (value === "license") return "license";
  if (value === "other") return "other";
  return undefined;
}

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
    const statusGroup = params.get("statusGroup") || "";
    const status = params.get("status") || "";
    const priority = params.get("priority") || "";
    const assignee = params.get("assignee") || "";
    const search = params.get("search") || "";
    const category = params.get("category") || "";
    const date = params.get("date") || "";
    const page = Number(params.get("page") || "0");
    const limit = Number(params.get("limit") || "20");
    const linkType = String(params.get("linkType") || "")
      .trim()
      .toLowerCase();
    const linkId = String(params.get("linkId") || "").trim();

    const query: Record<string, any> = { published: true };

    const canManage = principal.permissions.includes("tasks.manage");
    if (scope === "mine" || (!canManage && scope !== "related")) {
      query.assignedTo = principal.userId;
    } else if (assignee) {
      query.assignedTo = assignee;
    }

    if (scope === "related") {
      if (!canManage) {
        query.assignedTo = principal.userId;
      }

      if (!linkType || !linkId) {
        return Response.json(
          { error: "linkType and linkId are required for related scope" },
          { status: 400 },
        );
      }

      if (!ALLOWED_LINK_TARGET_TYPES.has(linkType)) {
        return Response.json(
          { error: "Unsupported linkType for related scope" },
          { status: 400 },
        );
      }

      query.linkedTargets = {
        $elemMatch: {
          targetType: linkType,
          targetId: linkId,
        },
      };
    }

    if (status) {
      query.status = status;
    } else if (statusGroup === "active") {
      query.status = { $in: ["todo", "in_progress"] };
    } else if (statusGroup === "completed") {
      query.status = "completed";
    } else if (statusGroup === "cancelled") {
      query.status = "cancelled";
    }
    if (priority) query.priority = priority;
    if (category) {
      const normalizedCategory = normalizeTaskCategory(category);
      if (normalizedCategory) {
        query.category = normalizedCategory;
      }
    }
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

    const aggregateMatch: Record<string, any> = { ...query };
    if (typeof aggregateMatch.assignedTo === "string" && mongoose.Types.ObjectId.isValid(aggregateMatch.assignedTo)) {
      aggregateMatch.assignedTo = new mongoose.Types.ObjectId(aggregateMatch.assignedTo);
    }

    const farFutureDate = new Date("9999-12-31T23:59:59.999Z");
    const [tasks, total] = await Promise.all([
      Task.aggregate([
        { $match: aggregateMatch },
        {
          $addFields: {
            priorityRank: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priority", "urgent"] }, then: 4 },
                  { case: { $eq: ["$priority", "high"] }, then: 3 },
                  { case: { $eq: ["$priority", "medium"] }, then: 2 },
                  { case: { $eq: ["$priority", "low"] }, then: 1 },
                ],
                default: 0,
              },
            },
            dueDateSort: { $ifNull: ["$dueDate", farFutureDate] },
          },
        },
        { $sort: { priorityRank: -1, dueDateSort: 1, createdAt: -1 } },
        { $skip: page * limit },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "assignedTo",
            foreignField: "_id",
            as: "assignedTo",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "assignedBy",
            foreignField: "_id",
            as: "assignedBy",
          },
        },
        {
          $unwind: {
            path: "$assignedTo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$assignedBy",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            status: 1,
            priority: 1,
            category: 1,
            dueDate: 1,
            completionNote: 1,
            cancellationNote: 1,
            linkedTargets: 1,
            createdAt: 1,
            updatedAt: 1,
            assignedTo: {
              _id: "$assignedTo._id",
              username: "$assignedTo.username",
              fullname: "$assignedTo.fullname",
              role: "$assignedTo.role",
            },
            assignedBy: {
              _id: "$assignedBy._id",
              username: "$assignedBy.username",
              fullname: "$assignedBy.fullname",
              role: "$assignedBy.role",
            },
          },
        },
      ]),
      Task.countDocuments(query),
    ]);

    // Enrich linkedTargets with entity details
    const enrichedTasks = await Promise.all(
      tasks.map(async (task: any) => {
        if (!task.linkedTargets || task.linkedTargets.length === 0) {
          return task;
        }

        const enrichedTargets = await Promise.all(
          task.linkedTargets.map(async (target: any) => {
            try {
              let entity: any = null;

              if (target.targetType === "company") {
                entity = await Company.findById(target.targetId).select("name").lean();
              } else if (target.targetType === "employee") {
                entity = await Employee.findById(target.targetId).select("name").lean();
              } else if (target.targetType === "individual") {
                entity = await Individual.findById(target.targetId).select("name").lean();
              }

              return {
                ...target,
                targetLabel: entity?.name || target.targetLabel || target.targetId,
              };
            } catch (err) {
              return target;
            }
          })
        );

        return { ...task, linkedTargets: enrichedTargets };
      })
    );

    return Response.json(
      {
        tasks: enrichedTasks,
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
      category,
      dueDate,
      assignedTo,
      linkedTargets,
    }: {
      title?: string;
      description?: string;
      priority?: "low" | "medium" | "high" | "urgent";
      category?: "visa" | "license" | "other";
      dueDate?: string | null;
      assignedTo?: string;
      linkedTargets?: Array<{
        targetType?: string;
        targetId?: string;
        targetLabel?: string;
      }>;
    } = await request.json();

    if (!title?.trim()) {
      return Response.json({ error: "Task title is required" }, { status: 400 });
    }

    if (!assignedTo) {
      return Response.json({ error: "Assignee is required" }, { status: 400 });
    }

    const normalizedLinks = parseLinkedTargets(linkedTargets);
    const normalizedCategory = normalizeTaskCategory(category);

    const task = await Task.create({
      title: title.trim(),
      description: (description || "").trim(),
      priority: priority || "medium",
      category: normalizedCategory,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedTo,
      assignedBy: principal.userId,
      status: "todo",
      taskHistory: [
        {
          action: "created",
          status: "todo",
          note: "",
          changedBy: principal.userId,
          changedAt: new Date(),
        },
      ],
      linkedTargets: normalizedLinks,
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
