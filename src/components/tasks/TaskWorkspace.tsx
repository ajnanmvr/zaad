"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import clsx from "clsx";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiFilter,
  FiFlag,
  FiPlus,
  FiSearch,
  FiTarget,
  FiUser,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";

import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import ExportActionsMenu from "@/components/common/ExportActionsMenu";
import { exportRowsCsv, exportRowsExcel, exportRowsPdf } from "@/utils/exportTableData";
import { useUserContext } from "@/contexts/UserContext";
import { getDocumentCategoryLabel, normalizeDocumentCategory } from "@/config/documentCategoryVisuals";

type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";
type TaskPriority = "low" | "medium" | "high" | "urgent";
type TaskCategory = "visa" | "license" | "other" | "";

type LinkedTargetType =
  | "company"
  | "employee"
  | "individual";

type LinkedTarget = {
  targetType: LinkedTargetType;
  targetId: string;
  targetLabel?: string;
};

type TaskItem = {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: "visa" | "license" | "other";
  dueDate?: string | null;
  completionNote?: string;
  assignedTo: { _id: string; username: string; fullname?: string };
  assignedBy: { _id: string; username: string; fullname?: string };
  linkedTargets?: Array<{
    targetType: string;
    targetId: string;
    targetLabel?: string;
  }>;
};

type TaskResponse = {
  tasks: TaskItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTasks: number;
    hasMore: boolean;
  };
};

type CalendarTask = {
  _id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  category?: "visa" | "license" | "other";
  dueDate: string;
  assignedTo?: { _id: string; username?: string; fullname?: string };
};

type UserOption = {
  _id: string;
  username: string;
  fullname?: string;
};

type LinkSuggestion = {
  id: string;
  label: string;
  subtitle?: string;
};

const pageSize = 20;
const ALLOWED_LINK_TARGET_TYPES = new Set<LinkedTargetType>(["company", "employee", "individual"]);

const priorityBadgeMap: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  urgent: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const statusBadgeMap: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const categoryBadgeMap: Record<Exclude<TaskCategory, "">, string> = {
  visa: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  license: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  other: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function parseIsoDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function normalizeTaskCategory(value?: string | null): TaskCategory {
  if (!value) return "";
  return normalizeDocumentCategory(value);
}

function mapTaskExportRows(rows: TaskItem[]) {
  return rows.map((task) => ({
    Title: task.title,
    Status: task.status.replace("_", " "),
    Priority: task.priority,
    Category: task.category ? getDocumentCategoryLabel(task.category) : "",
    DueDate: parseIsoDate(task.dueDate),
    AssignedTo: task.assignedTo?.fullname || task.assignedTo?.username || "",
    LinkedTargets: (task.linkedTargets || [])
      .map((item) => `${item.targetType}:${item.targetLabel || item.targetId}`)
      .join(" | "),
  }));
}

export default function TaskWorkspace({
  mode,
  initialView = "list",
}: {
  mode: "mine" | "manage";
  initialView?: "list" | "calendar";
}) {
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const canManage =
    Array.isArray(user?.permissions) && user.permissions.includes("tasks.manage");
  const canRead =
    Array.isArray(user?.permissions) &&
    (user.permissions.includes("tasks.read") ||
      user.permissions.includes("tasks.complete") ||
      user.permissions.includes("tasks.manage"));

  const [activeView, setActiveView] = useState<"list" | "calendar">(initialView);
  const [scope, setScope] = useState<"mine" | "manage">(mode === "manage" ? "manage" : "mine");

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState<TaskCategory>("");
  const [search, setSearch] = useState("");
  const [assignee, setAssignee] = useState("");
  const [page, setPage] = useState(0);

  const dateFromQuery = searchParams.get("date") || "";
  const normalizedDateFromQuery = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFromQuery)) return "";
    const parsed = new Date(`${dateFromQuery}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? "" : dateFromQuery;
  }, [dateFromQuery]);

  const [selectedDate, setSelectedDate] = useState(normalizedDateFromQuery);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [calendarShowAll, setCalendarShowAll] = useState(false);
  const [showDateBrief, setShowDateBrief] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskCategory, setTaskCategory] = useState<TaskCategory>("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskLinkedTargets, setTaskLinkedTargets] = useState<LinkedTarget[]>([]);

  const [linkTargetType, setLinkTargetType] = useState<LinkedTargetType>("company");
  const [linkSearch, setLinkSearch] = useState("");
  const [debouncedLinkSearch, setDebouncedLinkSearch] = useState("");
  const [linkSearchNonce, setLinkSearchNonce] = useState(0);

  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState("");

  const monthKey = useMemo(() => format(viewMonth, "yyyy-MM"), [viewMonth]);
  const todayKey = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  useEffect(() => {
    setSelectedDate(normalizedDateFromQuery);
    setPage(0);
  }, [normalizedDateFromQuery]);

  useEffect(() => {
    if (!canManage) {
      setScope("mine");
      setCalendarShowAll(false);
    }
  }, [canManage]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLinkSearch(linkSearch.trim());
    }, 320);

    return () => clearTimeout(handler);
  }, [linkSearch]);

  const assigneesQuery = useQuery({
    queryKey: ["task-assignees", canManage],
    queryFn: async () => {
      const { data } = await axios.get("/api/tasks/assignees");
      return data.users as UserOption[];
    },
    enabled: canManage,
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks", scope, status, priority, category, search, assignee, page, selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        scope,
        page: String(page),
        limit: String(pageSize),
      });

      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      if (category) params.set("category", category);
      if (search.trim()) params.set("search", search.trim());
      if (selectedDate) params.set("date", selectedDate);
      if (scope === "manage" && assignee) params.set("assignee", assignee);

      const { data } = await axios.get(`/api/tasks?${params.toString()}`);
      return data as TaskResponse;
    },
    enabled: canRead,
    placeholderData: keepPreviousData,
  });

  const calendarQuery = useQuery({
    queryKey: ["tasks-calendar", scope, monthKey, calendarShowAll],
    queryFn: async () => {
      const params = new URLSearchParams({
        scope,
        month: monthKey,
        showAllUsers: String(canManage && calendarShowAll),
      });

      const { data } = await axios.get(`/api/tasks/calendar?${params.toString()}`);
      return data as { tasks: CalendarTask[] };
    },
    enabled: canRead,
    placeholderData: keepPreviousData,
  });

  const linkSuggestionsQuery = useQuery({
    queryKey: ["task-link-suggestions", linkTargetType, debouncedLinkSearch, linkSearchNonce],
    queryFn: async () => {
      const params = new URLSearchParams({
        targetType: linkTargetType,
        q: debouncedLinkSearch,
      });

      const { data } = await axios.get(`/api/tasks/link-suggestions?${params.toString()}`);
      return data.items as LinkSuggestion[];
    },
    enabled: showCreateModal && debouncedLinkSearch.length >= 2,
    staleTime: 30_000,
  });

  const tasks = useMemo(() => tasksQuery.data?.tasks || [], [tasksQuery.data?.tasks]);
  const pagination = tasksQuery.data?.pagination;
  const assignees = useMemo(() => assigneesQuery.data || [], [assigneesQuery.data]);
  const calendarTasks = useMemo(() => calendarQuery.data?.tasks || [], [calendarQuery.data?.tasks]);
  const linkSuggestions = useMemo(() => linkSuggestionsQuery.data || [], [linkSuggestionsQuery.data]);

  const calendarTasksByDay = useMemo(() => {
    return calendarTasks.reduce<Record<string, CalendarTask[]>>((acc, task) => {
      const dayKey = format(new Date(task.dueDate), "yyyy-MM-dd");
      const existing = acc[dayKey] || [];
      acc[dayKey] = [...existing, task];
      return acc;
    }, {});
  }, [calendarTasks]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });

    const days: Date[] = [];
    let cursor = start;
    while (cursor <= end) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }

    return days;
  }, [viewMonth]);

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [] as CalendarTask[];

    return (calendarTasksByDay[selectedDate] || []).sort((a, b) => {
      const aTime = new Date(a.dueDate).getTime();
      const bTime = new Date(b.dueDate).getTime();
      return aTime - bTime;
    });
  }, [calendarTasksByDay, selectedDate]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter((item) => item.status === "in_progress").length;
    const completed = tasks.filter((item) => item.status === "completed").length;
    const overdue = tasks.filter((item) => {
      if (!item.dueDate || item.status === "completed" || item.status === "cancelled") {
        return false;
      }
      return new Date(item.dueDate).getTime() < Date.now();
    }).length;

    return { total, inProgress, completed, overdue };
  }, [tasks]);

  const normalizeLinkedTargets = (targets: LinkedTarget[]) => {
    const dedupe = new Set<string>();

    return targets
      .map((item) => {
        const targetType = String(item.targetType || "").trim().toLowerCase();
        const targetId = String(item.targetId || "").trim();
        const targetLabel = String(item.targetLabel || "").trim();

        if (!targetType || !targetId || !ALLOWED_LINK_TARGET_TYPES.has(targetType as LinkedTargetType)) {
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
  };

  const addLinkedTarget = (item: LinkSuggestion) => {
    const exists = taskLinkedTargets.some(
      (target) => target.targetType === linkTargetType && target.targetId === item.id,
    );

    if (exists) {
      toast("Already linked");
      return;
    }

    setTaskLinkedTargets((prev) => [
      ...prev,
      {
        targetType: linkTargetType,
        targetId: item.id,
        targetLabel: item.label,
      },
    ]);
    setLinkSearch("");
    setDebouncedLinkSearch("");
  };

  const unlinkLinkedTarget = (targetType: string, targetId: string) => {
    setTaskLinkedTargets((prev) =>
      prev.filter((item) => !(item.targetType === targetType && item.targetId === targetId)),
    );
  };

  const createTaskMutation = useMutation({
    mutationFn: () =>
      axios.post("/api/tasks", {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        category: taskCategory || undefined,
        dueDate: taskDueDate || null,
        assignedTo: taskAssignee,
        linkedTargets: normalizeLinkedTargets(taskLinkedTargets),
      }),
    onSuccess: () => {
      toast.success("Task created");
      setShowCreateModal(false);
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("medium");
      setTaskCategory("");
      setTaskDueDate("");
      setTaskAssignee("");
      setTaskLinkedTargets([]);
      setLinkSearch("");
      setDebouncedLinkSearch("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["task-notifications"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to create task");
    },
  });

  const quickStatusMutation = useMutation({
    mutationFn: ({ taskId, nextStatus }: { taskId: string; nextStatus: TaskStatus }) =>
      axios.put(`/api/tasks/${taskId}`, {
        status: nextStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["task-notifications"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to update status");
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      axios.patch(`/api/tasks/${taskId}/complete`, {
        completionNote: completionNote.trim(),
      }),
    onSuccess: () => {
      toast.success("Task completed");
      setCompleteTaskId(null);
      setCompletionNote("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["task-notifications"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to complete task");
    },
  });

  const onCreateTask = (event: FormEvent) => {
    event.preventDefault();

    if (!taskTitle.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (!taskAssignee) {
      toast.error("Assignee is required");
      return;
    }

    createTaskMutation.mutate();
  };

  const onExport = async (formatType: "csv" | "excel" | "pdf", exportMode: "selected" | "all") => {
    const exportRows = mapTaskExportRows(tasks);

    if (!exportRows.length) {
      toast.error("No tasks to export");
      return;
    }

    if (formatType === "csv") {
      exportRowsCsv(exportRows, "tasks");
    } else if (formatType === "excel") {
      exportRowsExcel(exportRows, "tasks");
    } else {
      await exportRowsPdf(exportRows, "tasks");
    }

    const label = exportMode === "selected" ? "Selected" : "Visible";
    toast.success(`${label} tasks exported as ${formatType.toUpperCase()}`);
  };

  const updateDateInUrl = (nextDate: string | null) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextDate) {
      nextParams.set("date", nextDate);
    } else {
      nextParams.delete("date");
    }

    const nextQuery = nextParams.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  const selectDate = (nextDate: string) => {
    setSelectedDate(nextDate);
    setPage(0);
    setShowDateBrief(true);
    updateDateInUrl(nextDate);
  };

  const clearDateFilter = () => {
    setSelectedDate("");
    setPage(0);
    setShowDateBrief(false);
    updateDateInUrl(null);
  };

  const goRelativeDate = (delta: number) => {
    const base = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
    const next = format(addDays(base, delta), "yyyy-MM-dd");
    selectDate(next);
  };

  if (!canRead) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
        You do not have access to tasks.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={Boolean(completeTaskId)}
        title="Complete Task"
        message="Mark this task as completed?"
        confirmLabel={completeTaskMutation.isPending ? "Saving..." : "Mark Completed"}
        cancelLabel="Cancel"
        variant="primary"
        isLoading={completeTaskMutation.isPending}
        onCancel={() => {
          setCompleteTaskId(null);
          setCompletionNote("");
        }}
        onConfirm={() => {
          if (completeTaskId) {
            completeTaskMutation.mutate(completeTaskId);
          }
        }}
      />

      <section className="relative overflow-hidden rounded-3xl border border-cyan-200/70 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.22),transparent_42%),radial-gradient(circle_at_100%_100%,rgba(34,197,94,0.18),transparent_46%),linear-gradient(135deg,#f0fdfa,#ffffff_48%,#eff6ff)] p-6 shadow-sm dark:border-cyan-900/30 dark:bg-[radial-gradient(circle_at_0%_0%,rgba(6,182,212,0.22),transparent_42%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.12),transparent_46%),linear-gradient(135deg,#0f172a,#0b1120_48%,#0a1726)]">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-700/50 dark:bg-cyan-900/20 dark:text-cyan-300">
              <FiTarget />
              Task Workspace
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Clean Task Management
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
              Keep list simple, open each task for details, and manage due dates in calendar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView("list")}
              className={clsx(
                "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                activeView === "list"
                  ? "border-cyan-300 bg-cyan-100 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
              )}
            >
              Tasks List
            </button>
            <button
              type="button"
              onClick={() => setActiveView("calendar")}
              className={clsx(
                "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                activeView === "calendar"
                  ? "border-cyan-300 bg-cyan-100 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
              )}
            >
              Calendar
            </button>
          </div>
        </div>

        <div className="relative z-10 mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-3 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white/85 p-3 dark:border-indigo-800/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">In Progress</p>
            <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-300">{stats.inProgress}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-white/85 p-3 dark:border-emerald-800/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Completed</p>
            <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-300">{stats.completed}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-white/85 p-3 dark:border-rose-800/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Overdue</p>
            <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-300">{stats.overdue}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                Scope
              </span>
              <div className="inline-flex rounded-xl border border-slate-300 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setScope("mine");
                    setPage(0);
                  }}
                  className={clsx(
                    "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                    scope === "mine"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900",
                  )}
                >
                  My Tasks
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScope("manage");
                    setPage(0);
                  }}
                  disabled={!canManage}
                  className={clsx(
                    "rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                    scope === "manage"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900",
                  )}
                >
                  All Tasks
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ExportActionsMenu onExport={onExport} />
              {canManage ? (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-700 hover:to-cyan-700"
                >
                  <FiPlus />
                  New Task
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-12">
            <div className="relative xl:col-span-4">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                placeholder="Search task title"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div className="relative xl:col-span-2">
              <FiFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(0);
                }}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">All Status</option>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="relative xl:col-span-2">
              <FiFlag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={priority}
                onChange={(event) => {
                  setPriority(event.target.value);
                  setPage(0);
                }}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="relative xl:col-span-2">
              <FiTarget className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value as TaskCategory);
                  setPage(0);
                }}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">All Labels</option>
                <option value="visa">Visa Related</option>
                <option value="license">License Related</option>
                <option value="other">Other</option>
              </select>
            </div>

            {scope === "manage" && canManage ? (
              <div className="relative xl:col-span-2">
                <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={assignee}
                  onChange={(event) => {
                    setAssignee(event.target.value);
                    setPage(0);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="">All Assignees</option>
                  {assignees.map((option) => (
                    <option key={option._id} value={option._id}>
                      {option.fullname || option.username}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {selectedDate ? (
            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 dark:border-cyan-800/50 dark:bg-cyan-900/20 dark:text-cyan-300">
              <FiCalendar />
              Due on {new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}
              <button
                type="button"
                onClick={clearDateFilter}
                className="rounded-md border border-cyan-300 px-2 py-0.5 text-[11px] dark:border-cyan-700"
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {activeView === "list" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          {tasksQuery.isLoading ? (
            <div className="rounded-2xl border border-slate-200 p-8 text-center text-slate-500 dark:border-slate-700">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">No tasks found.</div>
          ) : (
            <>
              <div className="max-w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/40">
                    <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      <th className="min-w-[260px] px-4 pb-3 pt-3">Task</th>
                      <th className="min-w-[130px] px-4 pb-3">Status</th>
                      <th className="min-w-[120px] px-4 pb-3">Priority</th>
                      <th className="min-w-[130px] px-4 pb-3">Due Date</th>
                      <th className="min-w-[160px] px-4 pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const overdue =
                        task.dueDate &&
                        task.status !== "completed" &&
                        task.status !== "cancelled" &&
                        new Date(task.dueDate).getTime() < Date.now();

                      return (
                        <tr
                          key={task._id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/tasks/${task._id}`}
                              className="text-sm font-bold text-cyan-700 hover:underline dark:text-cyan-300"
                            >
                              {task.title}
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{task.assignedTo?.fullname || task.assignedTo?.username || "-"}</span>
                              {task.category ? (
                                <span className={clsx("rounded-full px-2 py-0.5 font-semibold", categoryBadgeMap[task.category])}>
                                  {getDocumentCategoryLabel(task.category)}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={task.status}
                              onChange={(event) =>
                                quickStatusMutation.mutate({
                                  taskId: task._id,
                                  nextStatus: event.target.value as TaskStatus,
                                })
                              }
                              className={clsx(
                                "rounded-lg border px-2 py-1.5 text-xs font-semibold",
                                task.status === "completed"
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                                  : task.status === "in_progress"
                                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                                    : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                              )}
                            >
                              <option value="todo">Todo</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span className={clsx("rounded-full px-2 py-1 text-xs font-semibold uppercase", priorityBadgeMap[task.priority])}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                            <div className={clsx(overdue && "font-semibold text-rose-600 dark:text-rose-300")}>{parseIsoDate(task.dueDate)}</div>
                            {overdue ? (
                              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                                <FiAlertCircle />
                                Overdue
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              {task.status !== "completed" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCompleteTaskId(task._id);
                                    setCompletionNote(task.completionNote || "");
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
                                >
                                  <FiCheckCircle />
                                  Complete
                                </button>
                              ) : null}
                              <Link
                                href={`/tasks/${task._id}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-cyan-300 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 dark:border-cyan-700 dark:text-cyan-300"
                              >
                                <FiEye />
                                Open
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <p>
                    Page {pagination.currentPage + 1} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                      disabled={pagination.currentPage <= 0}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50 dark:border-slate-700"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={!pagination.hasMore}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50 dark:border-slate-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Calendar</p>
                <h3 className="mt-1 text-base font-black text-slate-900 dark:text-slate-100">Task Due Dates</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMonth((prev) => subMonths(prev, 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <FiChevronLeft />
                </button>
                <p className="min-w-[130px] text-center text-sm font-bold text-slate-700 dark:text-slate-200">{format(viewMonth, "MMMM yyyy")}</p>
                <button
                  type="button"
                  onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCalendarShowAll(false);
                  setScope("mine");
                }}
                className={clsx(
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  !calendarShowAll
                    ? "border-cyan-300 bg-cyan-100 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                    : "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300",
                )}
              >
                My Tasks
              </button>
              <button
                type="button"
                disabled={!canManage}
                onClick={() => {
                  setCalendarShowAll(true);
                  setScope("manage");
                }}
                className={clsx(
                  "rounded-full border px-3 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50",
                  calendarShowAll
                    ? "border-cyan-300 bg-cyan-100 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                    : "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300",
                )}
              >
                All Tasks
              </button>
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/20 dark:text-rose-300">
                <FiAlertCircle />
                Red marker means overdue
              </span>
            </div>

            {calendarQuery.isLoading ? (
              <div className="rounded-2xl border border-slate-200 p-8 text-center text-slate-500 dark:border-slate-700">Loading calendar...</div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                  <div>Sun</div>
                </div>

                <div className="mt-1 grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const dayKey = format(day, "yyyy-MM-dd");
                    const dayTasks = calendarTasksByDay[dayKey] || [];
                    const muted = !isSameMonth(day, viewMonth);
                    const isToday = isSameDay(day, new Date());
                    const overdueCount = dayTasks.filter((task) => {
                      if (task.status === "completed" || task.status === "cancelled") return false;
                      return new Date(task.dueDate).getTime() < Date.now();
                    }).length;

                    return (
                      <button
                        key={dayKey}
                        type="button"
                        onClick={() => selectDate(dayKey)}
                        className={clsx(
                          "min-h-[84px] rounded-lg border p-1.5 text-left transition",
                          muted
                            ? "border-slate-200/60 bg-slate-50/60 text-slate-400 dark:border-slate-800 dark:bg-slate-900/30"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800/70",
                          isToday && "border-cyan-300 bg-cyan-50/70 dark:border-cyan-700 dark:bg-cyan-900/20",
                          selectedDate === dayKey && "ring-2 ring-cyan-400/60 dark:ring-cyan-500/60",
                          overdueCount > 0 && "border-rose-300 dark:border-rose-700/70",
                        )}
                        title={`View tasks on ${dayKey}`}
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] font-bold">{format(day, "d")}</span>
                          <span className="rounded-full bg-slate-900 px-1 py-0.5 text-[9px] font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                            {dayTasks.length}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {dayTasks.slice(0, 2).map((task) => {
                            const overdue =
                              task.status !== "completed" &&
                              task.status !== "cancelled" &&
                              new Date(task.dueDate).getTime() < Date.now();

                            return (
                              <div
                                key={task._id}
                                className={clsx(
                                  "truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                                  overdue
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                                    : statusBadgeMap[task.status],
                                )}
                              >
                                {task.title}
                              </div>
                            );
                          })}
                          {dayTasks.length > 2 ? (
                            <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">+{dayTasks.length - 2} more</p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">{selectedDate ? "Selected Day" : "Day Brief"}</h4>
              {selectedDate ? (
                <button
                  type="button"
                  onClick={() => setShowDateBrief((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  <FiEye />
                  {showDateBrief ? "Hide" : "Show"}
                </button>
              ) : null}
            </div>

            {selectedDate ? (
              <div className="mb-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800 dark:border-cyan-800/40 dark:bg-cyan-900/20 dark:text-cyan-300">
                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => goRelativeDate(-1)}
                    className="rounded-md border border-cyan-300 px-2 py-1 text-[11px] dark:border-cyan-700"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => goRelativeDate(1)}
                    className="rounded-md border border-cyan-300 px-2 py-1 text-[11px] dark:border-cyan-700"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={() => selectDate(todayKey)}
                    className="rounded-md border border-cyan-300 px-2 py-1 text-[11px] dark:border-cyan-700"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={clearDateFilter}
                    className="rounded-md border border-slate-300 px-2 py-1 text-[11px] dark:border-slate-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Click any date to see tasks for that day.</p>
            )}

            {showDateBrief && selectedDate ? (
              <div className="space-y-2">
                {selectedDateTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No tasks on this day.
                  </div>
                ) : (
                  selectedDateTasks.map((task) => {
                    const overdue =
                      task.status !== "completed" &&
                      task.status !== "cancelled" &&
                      new Date(task.dueDate).getTime() < Date.now();

                    return (
                      <div key={task._id} className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{task.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
                          <span className={clsx("rounded-full px-2 py-0.5 font-semibold capitalize", statusBadgeMap[task.status])}>
                            {task.status.replace("_", " ")}
                          </span>
                          <span className={clsx("rounded-full px-2 py-0.5 font-semibold uppercase", priorityBadgeMap[task.priority])}>
                            {task.priority}
                          </span>
                          {task.category ? (
                            <span className={clsx("rounded-full px-2 py-0.5 font-semibold", categoryBadgeMap[task.category])}>
                              {getDocumentCategoryLabel(task.category)}
                            </span>
                          ) : null}
                          {overdue ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                              <FiAlertCircle />
                              Overdue
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {task.assignedTo?.fullname || task.assignedTo?.username || "-"}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Brief panel hidden.
              </div>
            )}
          </div>
        </section>
      )}

      {showCreateModal ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/20 dark:text-cyan-300">
                  <FiTarget />
                  Create Task
                </p>
                <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">New Task</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={onCreateTask} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Task title"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
                <select
                  value={taskAssignee}
                  onChange={(event) => setTaskAssignee(event.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="">Select assignee</option>
                  {assignees.map((option) => (
                    <option key={option._id} value={option._id}>
                      {option.fullname || option.username}
                    </option>
                  ))}
                </select>

                <select
                  value={taskPriority}
                  onChange={(event) => setTaskPriority(event.target.value as TaskPriority)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                  <option value="urgent">Urgent priority</option>
                </select>

                <select
                  value={taskCategory}
                  onChange={(event) => setTaskCategory(event.target.value as TaskCategory)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="">No label</option>
                  <option value="visa">Visa Related</option>
                  <option value="license">License Related</option>
                  <option value="other">Other</option>
                </select>

                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(event) => setTaskDueDate(event.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 md:col-span-2"
                />
              </div>

              <textarea
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                placeholder="Description (optional)"
                rows={3}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Linked Data Targets</p>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-[170px_minmax(0,1fr)_42px]">
                  <select
                    value={linkTargetType}
                    onChange={(event) => setLinkTargetType(event.target.value as LinkedTargetType)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="company">Company</option>
                    <option value="employee">Employee</option>
                    <option value="individual">Individual</option>
                  </select>

                  <input
                    value={linkSearch}
                    onChange={(event) => setLinkSearch(event.target.value)}
                    placeholder="Type to search linked target"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setDebouncedLinkSearch(linkSearch.trim());
                      setLinkSearchNonce((prev) => prev + 1);
                    }}
                    className="inline-flex items-center justify-center rounded-lg border border-cyan-300 text-cyan-700 dark:border-cyan-700 dark:text-cyan-300"
                    title="Search"
                  >
                    <FiSearch />
                  </button>
                </div>

                {debouncedLinkSearch.length >= 2 ? (
                  <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    {linkSuggestionsQuery.isLoading ? (
                      <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">Searching...</div>
                    ) : linkSuggestions.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">No suggestions found.</div>
                    ) : (
                      linkSuggestions.map((item) => {
                        const alreadyLinked = taskLinkedTargets.some(
                          (target) => target.targetType === linkTargetType && target.targetId === item.id,
                        );

                        return (
                          <button
                            key={`${linkTargetType}-${item.id}`}
                            type="button"
                            onClick={() => addLinkedTarget(item)}
                            disabled={alreadyLinked}
                            className="flex w-full items-start justify-between gap-2 border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:hover:bg-slate-800/60"
                          >
                            <span>
                              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
                              {item.subtitle ? (
                                <span className="block text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</span>
                              ) : null}
                            </span>
                            {alreadyLinked ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                Linked
                              </span>
                            ) : null}
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Type at least 2 characters to search suggestions.</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {taskLinkedTargets.length === 0 ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400">No links selected.</span>
                  ) : (
                    taskLinkedTargets.map((target) => (
                      <span
                        key={`${target.targetType}-${target.targetId}`}
                        className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:border-cyan-800/50 dark:bg-cyan-900/20 dark:text-cyan-300"
                      >
                        {target.targetType}:{target.targetLabel || target.targetId}
                        <button
                          type="button"
                          onClick={() => unlinkLinkedTarget(target.targetType, target.targetId)}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-cyan-300 text-[10px] dark:border-cyan-700"
                          title="Unlink"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60"
                >
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {completeTaskId ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/10">
          <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Completion Note (optional)</h3>
          <textarea
            value={completionNote}
            onChange={(event) => setCompletionNote(event.target.value)}
            placeholder="Write a brief completion note"
            rows={3}
            className="mt-2 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm dark:border-emerald-800 dark:bg-slate-900"
          />
        </div>
      ) : null}
    </div>
  );
}
