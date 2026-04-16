"use client";

import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useState } from "react";
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiClock,
  FiColumns,
  FiGrid,
  FiFilter,
  FiFlag,
  FiPlus,
  FiSearch,
  FiTarget,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";

import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { useUserContext } from "@/contexts/UserContext";

type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";
type TaskPriority = "low" | "medium" | "high" | "urgent";

type LinkedTargetType =
  | "company"
  | "employee"
  | "individual"
  | "document"
  | "credential"
  | "handover"
  | "record"
  | "liability"
  | "invoice"
  | "payment"
  | "other";

type LinkedTarget = {
  targetType: LinkedTargetType | "";
  targetId: string;
  targetLabel?: string;
};

type TaskItem = {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  completionNote?: string;
  completedAt?: string | null;
  assignedTo: { _id: string; username: string; fullname?: string; role?: string };
  assignedBy: { _id: string; username: string; fullname?: string; role?: string };
  linkedTargets?: Array<{
    targetType: string;
    targetId: string;
    targetLabel?: string;
  }>;
  createdAt: string;
  updatedAt: string;
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

type UserOption = {
  _id: string;
  username: string;
  fullname?: string;
  role?: string;
};

type CalendarTask = {
  _id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignedTo?: { _id: string; username?: string; fullname?: string };
};

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

const priorityDotMap: Record<TaskPriority, string> = {
  low: "bg-slate-400",
  medium: "bg-sky-500",
  high: "bg-amber-500",
  urgent: "bg-rose-500",
};

const calendarUserDotPalette = [
  "bg-cyan-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-fuchsia-500",
  "bg-orange-500",
  "bg-lime-500",
  "bg-red-500",
  "bg-indigo-500",
];

const calendarUserPalette = [
  "border-l-cyan-500 bg-cyan-100/90 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200",
  "border-l-violet-500 bg-violet-100/90 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
  "border-l-emerald-500 bg-emerald-100/90 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  "border-l-fuchsia-500 bg-fuchsia-100/90 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-200",
  "border-l-orange-500 bg-orange-100/90 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200",
  "border-l-lime-500 bg-lime-100/90 text-lime-700 dark:bg-lime-900/40 dark:text-lime-200",
  "border-l-red-500 bg-red-100/90 text-red-700 dark:bg-red-900/40 dark:text-red-200",
  "border-l-indigo-500 bg-indigo-100/90 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200",
];

export default function TaskWorkspace({
  mode,
}: {
  mode: "mine" | "manage";
}) {
  const isManageView = mode === "manage";
  const { user } = useUserContext();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dateFromQuery = searchParams.get("date") || "";
  const normalizedDateFromQuery = useMemo(() => {
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dateFromQuery);
    if (!isValidDate) {
      return "";
    }

    const parsed = new Date(`${dateFromQuery}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? "" : dateFromQuery;
  }, [dateFromQuery]);

  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [search, setSearch] = useState("");
  const [assignee, setAssignee] = useState("");
  const [page, setPage] = useState(0);
  const [selectedDate, setSelectedDate] = useState(normalizedDateFromQuery);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [showAllUsersInCalendar, setShowAllUsersInCalendar] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newLinkedTargets, setNewLinkedTargets] = useState<LinkedTarget[]>([]);

  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<TaskStatus>("todo");
  const [editPriority, setEditPriority] = useState<TaskPriority>("medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editLinkedTargets, setEditLinkedTargets] = useState<LinkedTarget[]>([]);
  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState("");
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const canManage =
    Array.isArray(user?.permissions) && user.permissions.includes("tasks.manage");
  const canRead =
    Array.isArray(user?.permissions) &&
    (user.permissions.includes("tasks.read") ||
      user.permissions.includes("tasks.complete") ||
      user.permissions.includes("tasks.manage"));

  const todayKey = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const isSelectedDateToday = selectedDate === todayKey;

  const prefLinkType = String(searchParams.get("linkType") || "")
    .trim()
    .toLowerCase();
  const prefLinkId = String(searchParams.get("linkId") || "").trim();
  const prefLinkLabel = String(searchParams.get("linkLabel") || "").trim();

  useEffect(() => {
    if (!(mode === "manage" && canManage)) {
      return;
    }

    if (!prefLinkType || !prefLinkId) {
      return;
    }

    setShowCreate(true);
    setNewLinkedTargets((prev) => {
      if (
        prev.some(
          (item) => item.targetType === prefLinkType && item.targetId === prefLinkId,
        )
      ) {
        return prev;
      }

      return [
        ...prev,
        {
          targetType: prefLinkType as LinkedTargetType,
          targetId: prefLinkId,
          targetLabel: prefLinkLabel,
        },
      ];
    });
  }, [canManage, mode, prefLinkId, prefLinkLabel, prefLinkType]);

  useEffect(() => {
    setSelectedDate(normalizedDateFromQuery);
    setPage(0);
  }, [normalizedDateFromQuery]);

  const tasksQuery = useQuery({
    queryKey: ["tasks", mode, status, priority, search, assignee, page, selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        scope: mode,
        page: String(page),
        limit: "20",
      });
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      if (search.trim()) params.set("search", search.trim());
      if (selectedDate) params.set("date", selectedDate);
      if (mode === "manage" && assignee) params.set("assignee", assignee);

      const { data } = await axios.get(`/api/tasks?${params.toString()}`);
      return data as TaskResponse;
    },
    enabled: canRead,
    placeholderData: keepPreviousData,
  });

  const assigneesQuery = useQuery({
    queryKey: ["task-assignees", canManage],
    queryFn: async () => {
      const { data } = await axios.get("/api/tasks/assignees");
      return data.users as UserOption[];
    },
    enabled: canManage,
  });

  const monthKey = useMemo(
    () => format(viewMonth, "yyyy-MM"),
    [viewMonth],
  );

  const calendarQuery = useQuery({
    queryKey: ["tasks-calendar", mode, monthKey, showAllUsersInCalendar, canManage],
    queryFn: async () => {
      const params = new URLSearchParams({
        scope: mode,
        month: monthKey,
        showAllUsers: String(mode === "manage" && canManage && showAllUsersInCalendar),
      });

      const { data } = await axios.get(`/api/tasks/calendar?${params.toString()}`);
      return data as { tasks: CalendarTask[] };
    },
    enabled: canRead,
    placeholderData: keepPreviousData,
  });

  const tasks = useMemo(() => tasksQuery.data?.tasks || [], [tasksQuery.data?.tasks]);
  const pagination = tasksQuery.data?.pagination;
  const assignees = useMemo(() => assigneesQuery.data || [], [assigneesQuery.data]);
  const calendarTasks = useMemo(
    () => calendarQuery.data?.tasks || [],
    [calendarQuery.data?.tasks],
  );

  const calendarUserColorMap = useMemo(() => {
    if (!(mode === "manage" && canManage && showAllUsersInCalendar)) {
      return {} as Record<string, string>;
    }

    const uniqueIds = Array.from(
      new Set(
        calendarTasks
          .map((task) => task.assignedTo?._id)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    return uniqueIds.reduce<Record<string, string>>((acc, userId, index) => {
      acc[userId] = calendarUserPalette[index % calendarUserPalette.length];
      return acc;
    }, {});
  }, [calendarTasks, canManage, mode, showAllUsersInCalendar]);

  const calendarUserDotMap = useMemo(() => {
    if (!(mode === "manage" && canManage && showAllUsersInCalendar)) {
      return {} as Record<string, string>;
    }

    const uniqueIds = Array.from(
      new Set(
        calendarTasks
          .map((task) => task.assignedTo?._id)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    return uniqueIds.reduce<Record<string, string>>((acc, userId, index) => {
      acc[userId] = calendarUserDotPalette[index % calendarUserDotPalette.length];
      return acc;
    }, {});
  }, [calendarTasks, canManage, mode, showAllUsersInCalendar]);

  const calendarTasksByDay = useMemo(() => {
    return calendarTasks.reduce<Record<string, CalendarTask[]>>((acc, task) => {
      if (!task.dueDate) {
        return acc;
      }

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

  const calendarUserLegend = useMemo(() => {
    if (!(mode === "manage" && canManage && showAllUsersInCalendar)) {
      return [] as Array<{ userId: string; label: string; colorClass: string }>;
    }

    const seen = new Set<string>();
    const legendItems: Array<{ userId: string; label: string; colorClass: string }> = [];

    for (const task of calendarTasks) {
      const userId = task.assignedTo?._id;
      if (!userId || seen.has(userId)) {
        continue;
      }

      seen.add(userId);
      legendItems.push({
        userId,
        label: task.assignedTo?.fullname || task.assignedTo?.username || "Unknown user",
        colorClass: calendarUserColorMap[userId] || calendarUserPalette[0],
      });
    }

    return legendItems;
  }, [calendarTasks, calendarUserColorMap, canManage, mode, showAllUsersInCalendar]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((item) => item.status === "completed").length;
    const inProgress = tasks.filter((item) => item.status === "in_progress").length;
    const overdue = tasks.filter((item) => {
      if (!item.dueDate || item.status === "completed" || item.status === "cancelled") {
        return false;
      }
      return new Date(item.dueDate).getTime() < Date.now();
    }).length;

    return { total, completed, inProgress, overdue };
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    const now = Date.now();

    return [...tasks]
      .filter((task) => task.dueDate && task.status !== "completed" && task.status !== "cancelled")
      .sort((a, b) => {
        const aTime = new Date(a.dueDate as string).getTime();
        const bTime = new Date(b.dueDate as string).getTime();

        const aUpcomingBucket = aTime >= now ? 0 : 1;
        const bUpcomingBucket = bTime >= now ? 0 : 1;

        if (aUpcomingBucket !== bUpcomingBucket) {
          return aUpcomingBucket - bUpcomingBucket;
        }

        return aTime - bTime;
      })
      .slice(0, 8);
  }, [tasks]);

  const targetTypeOptions: Array<{ value: LinkedTargetType; label: string }> = [
    { value: "company", label: "Company" },
    { value: "employee", label: "Employee" },
    { value: "individual", label: "Individual" },
    { value: "document", label: "Document" },
    { value: "credential", label: "Credential" },
    { value: "handover", label: "Document Handover" },
    { value: "record", label: "Record" },
    { value: "liability", label: "Liability" },
    { value: "invoice", label: "Invoice" },
    { value: "payment", label: "Payment" },
    { value: "other", label: "Other" },
  ];

  const normalizeLinkedTargets = (targets: LinkedTarget[]) => {
    const seen = new Set<string>();

    return targets
      .map((item) => {
        const targetType = String(item.targetType || "").trim().toLowerCase();
        const targetId = String(item.targetId || "").trim();
        const targetLabel = String(item.targetLabel || "").trim();
        if (!targetType || !targetId) {
          return null;
        }

        const key = `${targetType}:${targetId}`;
        if (seen.has(key)) {
          return null;
        }
        seen.add(key);

        return { targetType, targetId, targetLabel };
      })
      .filter(Boolean);
  };

  const addLinkedTargetRow = (
    setter: Dispatch<SetStateAction<LinkedTarget[]>>,
  ) => {
    setter((prev) => [...prev, { targetType: "", targetId: "", targetLabel: "" }]);
  };

  const removeLinkedTargetRow = (
    setter: Dispatch<SetStateAction<LinkedTarget[]>>,
    index: number,
  ) => {
    setter((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateLinkedTargetRow = (
    setter: Dispatch<SetStateAction<LinkedTarget[]>>,
    index: number,
    field: keyof LinkedTarget,
    value: string,
  ) => {
    setter((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    );
  };

  const createTaskMutation = useMutation({
    mutationFn: () =>
      axios.post("/api/tasks", {
        title: newTitle,
        description: newDescription,
        priority: newPriority,
        dueDate: newDueDate || null,
        assignedTo: newAssignedTo,
        linkedTargets: normalizeLinkedTargets(newLinkedTargets),
      }),
    onSuccess: () => {
      toast.success("Task created and assigned");
      setShowCreate(false);
      setNewTitle("");
      setNewDescription("");
      setNewPriority("medium");
      setNewDueDate("");
      setNewAssignedTo("");
      setNewLinkedTargets([]);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-notifications"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create task");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      axios.put(`/api/tasks/${taskId}`, {
        status: editStatus,
        priority: editPriority,
        dueDate: editDueDate || null,
        assignedTo: editAssignee || undefined,
        linkedTargets: normalizeLinkedTargets(editLinkedTargets),
      }),
    onSuccess: () => {
      toast.success("Task updated");
      setEditTaskId(null);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-notifications"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update task");
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      axios.patch(`/api/tasks/${taskId}/complete`, {
        completionNote: completionNote.trim(),
      }),
    onSuccess: () => {
      toast.success("Task marked as completed");
      setCompleteTaskId(null);
      setCompletionNote("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-notifications"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to complete task");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => axios.delete(`/api/tasks/${taskId}`),
    onSuccess: () => {
      toast.success("Task deleted");
      setDeleteTaskId(null);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete task");
    },
  });

  const onCreateTask = (event: FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim() || !newAssignedTo) {
      toast.error("Title and assignee are required");
      return;
    }
    createTaskMutation.mutate();
  };

  const startEdit = (task: TaskItem) => {
    setEditTaskId(task._id);
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
    setEditAssignee(task.assignedTo?._id || "");
    setEditLinkedTargets(
      (task.linkedTargets || []).map((item) => ({
        targetType: (item.targetType || "") as LinkedTargetType,
        targetId: item.targetId || "",
        targetLabel: item.targetLabel || "",
      })),
    );
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
    updateDateInUrl(nextDate);
  };

  const goRelativeDate = (delta: number) => {
    const base = selectedDate
      ? new Date(`${selectedDate}T00:00:00`)
      : new Date();
    const next = format(addDays(base, delta), "yyyy-MM-dd");
    selectDate(next);
  };

  const clearDateFilter = () => {
    setSelectedDate("");
    setPage(0);
    updateDateInUrl(null);
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
        isOpen={Boolean(deleteTaskId)}
        title="Delete Task"
        message="Delete this task? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteTaskMutation.isPending}
        onCancel={() => setDeleteTaskId(null)}
        onConfirm={() => {
          if (deleteTaskId) deleteTaskMutation.mutate(deleteTaskId);
        }}
      />

      <section
        className={clsx(
          "relative overflow-hidden rounded-3xl p-5 shadow-sm sm:p-6",
          isManageView
            ? "border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:border-emerald-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20"
            : "border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-violet-50 dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20",
        )}
      >
        <div
          className={clsx(
            "pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl",
            isManageView ? "bg-emerald-300/20" : "bg-cyan-300/20",
          )}
        />
        <div
          className={clsx(
            "pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full blur-3xl",
            isManageView ? "bg-cyan-300/20" : "bg-violet-300/20",
          )}
        />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider",
                isManageView
                  ? "border-emerald-300/60 bg-emerald-100/80 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "border-cyan-300/60 bg-cyan-100/80 text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300",
              )}
            >
              <FiTarget />
              Task Management
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              {isManageView ? "Team Task Management" : "My Tasks"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              {isManageView
                ? "Create, assign, monitor and optimize team execution."
                : "Track your assigned work with a lighter, focused queue view."}
            </p>
          </div>

          <div className={clsx("grid grid-cols-2 gap-3 sm:grid-cols-4", isManageView ? "lg:min-w-[620px]" : "lg:min-w-[560px]")}> 
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-indigo-200/80 bg-white/80 p-4 dark:border-indigo-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">In Progress</p>
              <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-300">{stats.inProgress}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200/80 bg-white/80 p-4 dark:border-emerald-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Completed</p>
              <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-300">{stats.completed}</p>
            </div>
            <div className="rounded-2xl border border-rose-200/80 bg-white/80 p-4 dark:border-rose-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Overdue</p>
              <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-300">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </section>

      {isManageView ? (
        <section className={clsx("grid grid-cols-1 gap-4", !selectedDate && "xl:grid-cols-2")}>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Calendar</p>
              <h3 className="mt-1 text-sm font-black text-slate-900 dark:text-slate-100 sm:text-base">
                Mini Task Calendar
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMonth((prev) => subMonths(prev, 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <FiChevronLeft />
              </button>
              <p className="min-w-[140px] text-center text-xs font-bold text-slate-700 dark:text-slate-200 sm:text-sm">
                {format(viewMonth, "MMMM yyyy")}
              </p>
              <button
                type="button"
                onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <FiChevronRight />
              </button>

              {mode === "manage" && canManage ? (
                <button
                  type="button"
                  onClick={() => setShowAllUsersInCalendar((prev) => !prev)}
                  className={clsx(
                    "ml-1 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide",
                    showAllUsersInCalendar
                      ? "border-cyan-300 bg-cyan-100 text-cyan-700 dark:border-cyan-700/60 dark:bg-cyan-900/30 dark:text-cyan-300"
                      : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300",
                  )}
                >
                  {showAllUsersInCalendar ? <FiColumns /> : <FiGrid />}
                  {showAllUsersInCalendar ? "All Users" : "Only My Tasks"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2 py-0.5 dark:border-slate-700">
              <span className={clsx("h-2 w-2 rounded-full", priorityDotMap.low)} /> Low
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2 py-0.5 dark:border-slate-700">
              <span className={clsx("h-2 w-2 rounded-full", priorityDotMap.medium)} /> Medium
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2 py-0.5 dark:border-slate-700">
              <span className={clsx("h-2 w-2 rounded-full", priorityDotMap.high)} /> High
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2 py-0.5 dark:border-slate-700">
              <span className={clsx("h-2 w-2 rounded-full", priorityDotMap.urgent)} /> Urgent
            </span>
          </div>

          {calendarUserLegend.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {calendarUserLegend.map((entry) => (
                <span
                  key={entry.userId}
                  className={clsx("inline-flex items-center rounded-full border-l-4 px-2 py-0.5 font-semibold", entry.colorClass)}
                >
                  {entry.label}
                </span>
              ))}
            </div>
          ) : null}

          {calendarQuery.isLoading ? (
            <div className="mt-4 rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
              Loading calendar...
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
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

                  return (
                    <button
                      key={dayKey}
                      type="button"
                      onClick={() => {
                        if (dayTasks.length > 0) {
                          selectDate(dayKey);
                        }
                      }}
                      disabled={dayTasks.length === 0}
                      className={clsx(
                        "min-h-[62px] rounded-lg border p-1.5 text-left transition",
                        muted
                          ? "border-slate-200/60 bg-slate-50/60 text-slate-400 dark:border-slate-800 dark:bg-slate-900/30"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800/70",
                        isToday && "border-cyan-300 bg-cyan-50/70 dark:border-cyan-700 dark:bg-cyan-900/20",
                        selectedDate === dayKey && "ring-2 ring-cyan-400/60 dark:ring-cyan-500/60",
                        dayTasks.length === 0 && "cursor-default",
                      )}
                      title={dayTasks.length > 0 ? `View tasks due on ${dayKey}` : "No tasks on this day"}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[11px] font-bold">{format(day, "d")}</span>
                        {dayTasks.length > 0 ? (
                          <span className="rounded-full bg-slate-900 px-1 py-0.5 text-[9px] font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                            {dayTasks.length}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {dayTasks.slice(0, 5).map((task) => {
                          const userKey = task.assignedTo?._id || "unknown";
                          const dotTone =
                            mode === "manage" && canManage && showAllUsersInCalendar
                              ? calendarUserDotMap[userKey] || calendarUserDotPalette[0]
                              : priorityDotMap[task.priority];

                          return (
                            <span
                              key={task._id}
                              className={clsx("h-2 w-2 rounded-full", dotTone)}
                              title={task.title}
                            />
                          );
                        })}
                        {dayTasks.length > 5 ? (
                          <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                            +{dayTasks.length - 5}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          </div>

          {!selectedDate ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Timeline</p>
              <h3 className="mt-1 text-sm font-black text-slate-900 dark:text-slate-100 sm:text-base">
                Upcoming Tasks
              </h3>
            </div>
            <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">
              {upcomingTasks.length} shown
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {upcomingTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No upcoming tasks in current list filters.
              </div>
            ) : (
              upcomingTasks.map((task) => {
                const dueTime = new Date(task.dueDate as string).getTime();
                const isOverdue = dueTime < Date.now();

                return (
                  <div
                    key={task._id}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {task.title}
                      </p>
                      <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", priorityBadgeMap[task.priority])}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{task.assignedTo?.fullname || task.assignedTo?.username || "Unassigned"}</span>
                      <span>•</span>
                      <span className={clsx(isOverdue && "text-rose-600 dark:text-rose-300")}>
                        Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          </div>
          ) : null}
        </section>
      ) : (
        <section className="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm dark:border-cyan-900/30 dark:bg-slate-900/50 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-500">Focus</p>
              <h3 className="mt-1 text-sm font-black text-slate-900 dark:text-slate-100 sm:text-base">
                Personal task queue
              </h3>
            </div>
            <p className="max-w-2xl text-xs text-slate-500 dark:text-slate-400">
              Use filters to narrow your work and keep the list centered on assignments that need your attention.
            </p>
          </div>
        </section>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-6">
        {selectedDate ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-200 bg-cyan-50/70 p-3 dark:border-cyan-900/30 dark:bg-cyan-900/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-800 dark:text-cyan-200">
              Showing tasks due on {new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}
              {isSelectedDateToday ? (
                <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Today
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goRelativeDate(-1)}
                className="inline-flex items-center gap-1 rounded-lg border border-cyan-300 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100 dark:border-cyan-700 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-cyan-900/30"
              >
                <FiChevronLeft /> Previous Day
              </button>
              <button
                type="button"
                onClick={() => goRelativeDate(1)}
                className="inline-flex items-center gap-1 rounded-lg border border-cyan-300 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100 dark:border-cyan-700 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-cyan-900/30"
              >
                Next Day <FiChevronRight />
              </button>
              <button
                type="button"
                onClick={() => selectDate(todayKey)}
                className={clsx(
                  "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold",
                  isSelectedDateToday
                    ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "border-cyan-300 bg-white text-cyan-700 hover:bg-cyan-100 dark:border-cyan-700 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-cyan-900/30",
                )}
              >
                Today
              </button>
              <button
                type="button"
                onClick={clearDateFilter}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Clear
              </button>
            </div>
          </div>
        ) : null}

        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Search title or description"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div className="relative">
            <FiFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All status</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="relative">
            <FiFlag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value);
                setPage(0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {mode === "manage" && canManage ? (
            <div className="relative">
              <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={assignee}
                onChange={(event) => {
                  setAssignee(event.target.value);
                  setPage(0);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">All assignees</option>
                {assignees.map((option) => (
                  <option key={option._id} value={option._id}>
                    {option.fullname || option.username}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {mode === "manage" && canManage ? (
            <button
              type="button"
              onClick={() => setShowCreate((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <FiPlus />
              {showCreate ? "Close" : "Create Task"}
            </button>
          ) : null}
        </div>

        {showCreate && mode === "manage" ? (
          <form onSubmit={onCreateTask} className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Task title"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <select
                value={newAssignedTo}
                onChange={(event) => setNewAssignedTo(event.target.value)}
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
                value={newPriority}
                onChange={(event) => setNewPriority(event.target.value as TaskPriority)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
                <option value="urgent">Urgent priority</option>
              </select>
              <input
                type="date"
                value={newDueDate}
                onChange={(event) => setNewDueDate(event.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <textarea
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
                placeholder="Description (optional)"
                className="md:col-span-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                rows={3}
              />

              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white/90 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Linked Data Targets
                  </p>
                  <button
                    type="button"
                    onClick={() => addLinkedTargetRow(setNewLinkedTargets)}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
                  >
                    <FiPlus /> Add Link
                  </button>
                </div>

                {newLinkedTargets.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No linked data yet. Add one or more model links (company, employee, document, invoice, etc.).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {newLinkedTargets.map((item, index) => (
                      <div key={`new-link-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <select
                          value={item.targetType}
                          onChange={(event) =>
                            updateLinkedTargetRow(
                              setNewLinkedTargets,
                              index,
                              "targetType",
                              event.target.value,
                            )
                          }
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        >
                          <option value="">Type</option>
                          {targetTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <input
                          value={item.targetId}
                          onChange={(event) =>
                            updateLinkedTargetRow(
                              setNewLinkedTargets,
                              index,
                              "targetId",
                              event.target.value,
                            )
                          }
                          placeholder="Target ID"
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        />

                        <input
                          value={item.targetLabel || ""}
                          onChange={(event) =>
                            updateLinkedTargetRow(
                              setNewLinkedTargets,
                              index,
                              "targetLabel",
                              event.target.value,
                            )
                          }
                          placeholder="Optional label"
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        />

                        <button
                          type="button"
                          onClick={() => removeLinkedTargetRow(setNewLinkedTargets, index)}
                          className="inline-flex items-center justify-center rounded-lg border border-rose-300 px-2 py-2 text-rose-700 dark:border-rose-700 dark:text-rose-300"
                          title="Remove linked target"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={createTaskMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                <FiPlus />
                {createTaskMutation.isPending ? "Creating..." : "Assign Task"}
              </button>
            </div>
          </form>
        ) : null}

        <div className="space-y-3">
          {tasksQuery.isLoading ? (
            <div className="rounded-2xl border border-slate-200 p-8 text-center text-slate-500 dark:border-slate-700">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
              No tasks found for the current filters.
            </div>
          ) : (
            tasks.map((task) => {
              const isOverdue =
                task.dueDate &&
                task.status !== "completed" &&
                task.status !== "cancelled" &&
                new Date(task.dueDate).getTime() < Date.now();

              return (
                <div
                  key={task._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                        {task.title}
                      </h3>
                      {task.description ? (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{task.description}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={clsx("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", priorityBadgeMap[task.priority])}>
                        {task.priority}
                      </span>
                      <span className={clsx("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", statusBadgeMap[task.status])}>
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <FiUsers />
                      Assigned to: {task.assignedTo?.fullname || task.assignedTo?.username || "-"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FiUser />
                      Assigned by: {task.assignedBy?.fullname || task.assignedBy?.username || "-"}
                    </span>
                    <span className={clsx("inline-flex items-center gap-1", isOverdue && "text-rose-600 dark:text-rose-300")}>
                      <FiClock />
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                    </span>
                    {isOverdue ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                        <FiAlertCircle />
                        Overdue
                      </span>
                    ) : null}
                  </div>

                  {task.linkedTargets && task.linkedTargets.length > 0 ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {task.linkedTargets.map((link, idx) => (
                        <span
                          key={`${task._id}-link-${idx}`}
                          className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700 dark:border-cyan-800/50 dark:bg-cyan-900/20 dark:text-cyan-300"
                        >
                          <FiTarget className="text-[11px]" />
                          {link.targetType}:{link.targetLabel || link.targetId}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {task.completionNote ? (
                    <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Completion note: {task.completionNote}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {task.status !== "completed" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCompleteTaskId(task._id);
                          setCompletionNote(task.completionNote || "");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
                      >
                        <FiCheckCircle />
                        Mark Completed
                      </button>
                    ) : null}

                    {canManage && mode === "manage" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(task)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold dark:border-slate-700"
                        >
                          Edit Task
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTaskId(task._id)}
                          className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-700 dark:text-rose-300"
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>

                  {editTaskId === task._id && canManage ? (
                    <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 md:grid-cols-2 dark:border-slate-700 dark:bg-slate-800/50">
                      <select
                        value={editStatus}
                        onChange={(event) => setEditStatus(event.target.value as TaskStatus)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <select
                        value={editPriority}
                        onChange={(event) => setEditPriority(event.target.value as TaskPriority)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(event) => setEditDueDate(event.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      />
                      <select
                        value={editAssignee}
                        onChange={(event) => setEditAssignee(event.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        <option value="">Select assignee</option>
                        {assignees.map((option) => (
                          <option key={option._id} value={option._id}>
                            {option.fullname || option.username}
                          </option>
                        ))}
                      </select>

                      <div className="md:col-span-2 rounded-lg border border-slate-200 bg-white/90 p-2 dark:border-slate-700 dark:bg-slate-900/60">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Linked Data Targets
                          </p>
                          <button
                            type="button"
                            onClick={() => addLinkedTargetRow(setEditLinkedTargets)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
                          >
                            <FiPlus /> Add Link
                          </button>
                        </div>

                        {editLinkedTargets.length === 0 ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400">No linked targets.</p>
                        ) : (
                          <div className="space-y-2">
                            {editLinkedTargets.map((item, index) => (
                              <div
                                key={`edit-link-${index}`}
                                className="grid grid-cols-1 gap-2 md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_auto]"
                              >
                                <select
                                  value={item.targetType}
                                  onChange={(event) =>
                                    updateLinkedTargetRow(
                                      setEditLinkedTargets,
                                      index,
                                      "targetType",
                                      event.target.value,
                                    )
                                  }
                                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                                >
                                  <option value="">Type</option>
                                  {targetTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>

                                <input
                                  value={item.targetId}
                                  onChange={(event) =>
                                    updateLinkedTargetRow(
                                      setEditLinkedTargets,
                                      index,
                                      "targetId",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Target ID"
                                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                                />

                                <input
                                  value={item.targetLabel || ""}
                                  onChange={(event) =>
                                    updateLinkedTargetRow(
                                      setEditLinkedTargets,
                                      index,
                                      "targetLabel",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Optional label"
                                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeLinkedTargetRow(setEditLinkedTargets, index)
                                  }
                                  className="inline-flex items-center justify-center rounded-lg border border-rose-300 px-2 py-2 text-rose-700 dark:border-rose-700 dark:text-rose-300"
                                >
                                  <FiX />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2 flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => updateTaskMutation.mutate(task._id)}
                          disabled={updateTaskMutation.isPending}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {updateTaskMutation.isPending ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditTaskId(null)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold dark:border-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <p>
              Page {pagination.currentPage + 1} / {pagination.totalPages}
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
      </div>

      {completeTaskId ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/10">
          <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Complete Task</h3>
          <textarea
            value={completionNote}
            onChange={(event) => setCompletionNote(event.target.value)}
            placeholder="Optional completion note"
            rows={3}
            className="mt-2 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm dark:border-emerald-800 dark:bg-slate-900"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCompleteTaskId(null);
                setCompletionNote("");
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => completeTaskMutation.mutate(completeTaskId)}
              disabled={completeTaskMutation.isPending}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {completeTaskMutation.isPending ? "Saving..." : "Confirm Complete"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
