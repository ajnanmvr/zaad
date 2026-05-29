import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requireAuth } from "@/auth/guards";
import { hasPermission } from "@/auth/permissions";
import Company from "@/models/companies";
import Employee from "@/models/employees";
import Individual from "@/models/individuals";
import EntityDocument from "@/models/entityDocuments";
import Task from "@/models/tasks";
import calculateStatus from "@/utils/calculateStatus";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

type MonthBucket = {
  month: string;
  count: number;
};

type DocumentCategory = "visa" | "license" | "other";

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey: string) {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw) - 1;
  const date = new Date(year, month, 1);
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function initRecentMonths(size: number, now: Date): string[] {
  return Array.from({ length: size }, (_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (size - 1 - index), 1);
    return formatMonthKey(d);
  });
}

function normalizeCategory(value: unknown): DocumentCategory {
  if (typeof value !== "string") return "other";
  const normalized = value.trim().toLowerCase();
  if (normalized === "visa" || normalized === "license") return normalized;
  return "other";
}

async function runSafe<T>(
  enabled: boolean,
  runner: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!enabled) {
    return fallback;
  }

  try {
    return await runner();
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  try {
    await connect();

    const principal = await requireAuth(request);
    const permissions = principal.permissions || [];

    const canReadEntities =
      hasPermission(permissions, "entities.read") ||
      hasPermission(permissions, "entities.write");
    const canReadDocuments =
      hasPermission(permissions, "documents.read") ||
      hasPermission(permissions, "documents.write");
    const canReadTasks =
      hasPermission(permissions, "tasks.read") ||
      hasPermission(permissions, "tasks.manage") ||
      hasPermission(permissions, "tasks.complete");

    const now = new Date();
    const today = startOfDay(now);
    const next30Days = new Date(today);
    next30Days.setDate(next30Days.getDate() + 30);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

    const recentMonthKeys = initRecentMonths(6, now);

    const [
      companyCount,
      employeeCount,
      individualCount,
      documentsRaw,
      upcomingTasks,
      openTaskCount,
      inProgressTaskCount,
      completedTaskCount,
      overdueTaskCount,
    ] = await Promise.all([
      runSafe(canReadEntities, () => Company.countDocuments({ published: true }), 0),
      runSafe(canReadEntities, () => Employee.countDocuments({ published: true }), 0),
      runSafe(canReadEntities, () => Individual.countDocuments({ published: true }), 0),
      runSafe(
        canReadDocuments,
        () =>
          EntityDocument.find({ archived: { $ne: true } })
            .select("issueDate expiryDate documentTemplate createdAt updatedAt")
            .populate("documentTemplate", "category")
            .lean(),
        [] as Array<any>,
      ),
      runSafe(
        canReadTasks,
        () =>
          Task.find({
            published: true,
            assignedTo: principal.userId,
            status: { $nin: ["completed", "cancelled"] },
            dueDate: { $ne: null },
          })
            .select("title priority status dueDate")
            .sort({ dueDate: 1, priority: -1, createdAt: -1 })
            .limit(6),
        [] as Array<any>,
      ),
      runSafe(
        canReadTasks,
        () =>
          Task.countDocuments({
            published: true,
            assignedTo: principal.userId,
            status: { $nin: ["completed", "cancelled"] },
          }),
        0,
      ),
      runSafe(
        canReadTasks,
        () =>
          Task.countDocuments({
            published: true,
            assignedTo: principal.userId,
            status: "in_progress",
          }),
        0,
      ),
      runSafe(
        canReadTasks,
        () =>
          Task.countDocuments({
            published: true,
            assignedTo: principal.userId,
            status: "completed",
          }),
        0,
      ),
      runSafe(
        canReadTasks,
        () =>
          Task.countDocuments({
            published: true,
            assignedTo: principal.userId,
            status: { $nin: ["completed", "cancelled"] },
            dueDate: { $lt: now },
          }),
        0,
      ),
    ]);

    const documentStats = {
      total: 0,
      expired: 0,
      renewal: 0,
      valid: 0,
      renewedThisMonth: 0,
      expiringNext30Days: 0,
    };

    const monthlyRenewalsMap = new Map<string, number>();
    recentMonthKeys.forEach((key) => monthlyRenewalsMap.set(key, 0));

    const categoryRenewalsMap = new Map<string, number>();
    categoryRenewalsMap.set("visa", 0);
    categoryRenewalsMap.set("license", 0);
    categoryRenewalsMap.set("other", 0);

    const categoryExpiredMap = new Map<string, number>();
    categoryExpiredMap.set("visa", 0);
    categoryExpiredMap.set("license", 0);
    categoryExpiredMap.set("other", 0);

    for (const row of documentsRaw as Array<{ issueDate?: string; expiryDate?: string; createdAt?: string; updatedAt?: string; documentTemplate?: any }>) {
      const status = calculateStatus(row.expiryDate || "");
      const expiryDate = parseDate(row.expiryDate);
      const createdAt = parseDate(row.createdAt);
      const updatedAt = parseDate(row.updatedAt);
      const isEdited = Boolean(createdAt && updatedAt && updatedAt.getTime() > createdAt.getTime());

      documentStats.total += 1;

      if (status === "expired") documentStats.expired += 1;
      if (status === "renewal") documentStats.renewal += 1;
      if (status === "valid") documentStats.valid += 1;

      if (isEdited && updatedAt && updatedAt >= monthStart && updatedAt < monthEnd) {
        documentStats.renewedThisMonth += 1;
      }

      if (expiryDate && expiryDate >= today && expiryDate <= next30Days) {
        documentStats.expiringNext30Days += 1;
      }

      const normalizedCategory = normalizeCategory((row.documentTemplate as any)?.category);
      if (status === "renewal") {
        categoryRenewalsMap.set(normalizedCategory, (categoryRenewalsMap.get(normalizedCategory) || 0) + 1);
      } else if (status === "expired") {
        categoryExpiredMap.set(normalizedCategory, (categoryExpiredMap.get(normalizedCategory) || 0) + 1);
      }

      if (isEdited && updatedAt) {
        const key = formatMonthKey(updatedAt);
        if (monthlyRenewalsMap.has(key)) {
          monthlyRenewalsMap.set(key, (monthlyRenewalsMap.get(key) || 0) + 1);
        }
      }
    }

    const categoryRenewals = [
      { category: "Visa Related", count: categoryRenewalsMap.get("visa") || 0 },
      { category: "License Related", count: categoryRenewalsMap.get("license") || 0 },
      { category: "Other", count: categoryRenewalsMap.get("other") || 0 },
    ];

    const categoryExpiryRenewalBreakdown = [
      {
        category: "Visa Related",
        expired: categoryExpiredMap.get("visa") || 0,
        renewal: categoryRenewalsMap.get("visa") || 0,
      },
      {
        category: "License Related",
        expired: categoryExpiredMap.get("license") || 0,
        renewal: categoryRenewalsMap.get("license") || 0,
      },
      {
        category: "Other",
        expired: categoryExpiredMap.get("other") || 0,
        renewal: categoryRenewalsMap.get("other") || 0,
      },
    ];

    const monthlyRenewals: MonthBucket[] = recentMonthKeys.map((key) => ({
      month: formatMonthLabel(key),
      count: monthlyRenewalsMap.get(key) || 0,
    }));

    return Response.json(
      {
        counts: {
          companies: companyCount,
          employees: employeeCount,
          individuals: individualCount,
        },
        documentStats,
        monthlyRenewals,
        categoryRenewals,
        categoryExpiryRenewalBreakdown,
        upcomingTasks: (upcomingTasks as Array<any>).map((task) => ({
          id: task._id.toString(),
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        })),
        taskSummary: {
          open: openTaskCount,
          inProgress: inProgressTaskCount,
          completed: completedTaskCount,
          overdue: overdueTaskCount,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const status = getServiceErrorStatus(error);
    if (status >= 500) {
      console.error("Error fetching dashboard overview:", error);
    }

    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to fetch dashboard overview") },
      { status },
    );
  }
}

