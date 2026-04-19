import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requireAnyPermission } from "@/auth/guards";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import Task from "@/models/tasks";

function parseMonthKey(value: string | null) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  const [yearRaw, monthRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 0 || month > 11) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  return { year, month };
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
    const showAllUsers = params.get("showAllUsers") === "true";
    const monthParam = params.get("month");

    const { year, month } = parseMonthKey(monthParam);
    const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 1, 0, 0, 0, 0);

    const canManage = principal.permissions.includes("tasks.manage");

    const query: Record<string, unknown> = {
      published: true,
      dueDate: {
        $gte: monthStart,
        $lt: monthEnd,
      },
    };

    if (!canManage || scope === "mine" || !showAllUsers) {
      query.assignedTo = principal.userId;
    }

    const tasks = await Task.find(query)
      .select("title priority status category dueDate assignedTo")
      .populate("assignedTo", "username fullname")
      .sort({ dueDate: 1, priority: -1, createdAt: -1 });

    return Response.json({ tasks }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to fetch task calendar") },
      { status: getServiceErrorStatus(error) },
    );
  }
}

