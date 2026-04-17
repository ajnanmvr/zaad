"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiSearch,
  FiTarget,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
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
  createdAt: string;
  updatedAt: string;
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

const ALLOWED_LINK_TARGET_TYPES = new Set<LinkedTargetType>(["company", "employee", "individual"]);

function normalizeTaskCategory(value?: string | null): TaskCategory {
  if (!value) return "";
  return normalizeDocumentCategory(value);
}

function parseIsoDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUserContext();

  const canManage =
    Array.isArray(user?.permissions) && user.permissions.includes("tasks.manage");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo");
  const [taskCategory, setTaskCategory] = useState<TaskCategory>("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskLinkedTargets, setTaskLinkedTargets] = useState<LinkedTarget[]>([]);
  const [completionNote, setCompletionNote] = useState("");

  const [linkTargetType, setLinkTargetType] = useState<LinkedTargetType>("company");
  const [linkSearch, setLinkSearch] = useState("");
  const [debouncedLinkSearch, setDebouncedLinkSearch] = useState("");
  const [linkSearchNonce, setLinkSearchNonce] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLinkSearch(linkSearch.trim());
    }, 320);
    return () => clearTimeout(timer);
  }, [linkSearch]);

  const taskQuery = useQuery({
    queryKey: ["task-detail", params.id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/tasks/${params.id}`);
      return data.task as TaskItem;
    },
  });

  const assigneesQuery = useQuery({
    queryKey: ["task-assignees", canManage],
    queryFn: async () => {
      const { data } = await axios.get("/api/tasks/assignees");
      return data.users as UserOption[];
    },
    enabled: canManage,
  });

  const linkSuggestionsQuery = useQuery({
    queryKey: ["task-link-suggestions", linkTargetType, debouncedLinkSearch, linkSearchNonce],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        targetType: linkTargetType,
        q: debouncedLinkSearch,
      });
      const { data } = await axios.get(`/api/tasks/link-suggestions?${searchParams.toString()}`);
      return data.items as LinkSuggestion[];
    },
    enabled: showEditModal && debouncedLinkSearch.length >= 2,
    staleTime: 30_000,
  });

  const assignees = useMemo(() => assigneesQuery.data || [], [assigneesQuery.data]);
  const task = taskQuery.data;
  const linkSuggestions = useMemo(() => linkSuggestionsQuery.data || [], [linkSuggestionsQuery.data]);

  useEffect(() => {
    if (!task) return;

    setTaskTitle(task.title || "");
    setTaskDescription(task.description || "");
    setTaskPriority(task.priority || "medium");
    setTaskStatus(task.status || "todo");
    setTaskCategory(normalizeTaskCategory(task.category));
    setTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
    setTaskAssignee(task.assignedTo?._id || "");
    setTaskLinkedTargets(
      (task.linkedTargets || [])
        .map((item) => {
          const targetType = String(item.targetType || "").trim().toLowerCase() as LinkedTargetType;
          if (!ALLOWED_LINK_TARGET_TYPES.has(targetType)) {
            return null;
          }

          return {
            targetType,
            targetId: item.targetId,
            targetLabel: item.targetLabel || "",
          };
        })
        .filter(Boolean) as LinkedTarget[],
    );
    setCompletionNote(task.completionNote || "");
  }, [task]);

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

  const updateTaskMutation = useMutation({
    mutationFn: () =>
      axios.put(`/api/tasks/${params.id}`, {
        title: taskTitle,
        description: taskDescription,
        status: taskStatus,
        priority: taskPriority,
        category: taskCategory || null,
        dueDate: taskDueDate || null,
        assignedTo: canManage ? taskAssignee : undefined,
        linkedTargets: normalizeLinkedTargets(taskLinkedTargets),
      }),
    onSuccess: () => {
      toast.success("Task updated");
      setShowEditModal(false);
      queryClient.invalidateQueries({ queryKey: ["task-detail", params.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["task-notifications"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to update task");
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: () =>
      axios.patch(`/api/tasks/${params.id}/complete`, {
        completionNote: completionNote.trim(),
      }),
    onSuccess: () => {
      toast.success("Task completed");
      setShowCompleteConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["task-detail", params.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["task-notifications"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to complete task");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => axios.delete(`/api/tasks/${params.id}`),
    onSuccess: () => {
      toast.success("Task deleted");
      router.push("/tasks");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to delete task");
    },
  });

  const onUpdateTask = (event: FormEvent) => {
    event.preventDefault();
    if (!taskTitle.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (canManage && !taskAssignee) {
      toast.error("Assignee is required");
      return;
    }

    updateTaskMutation.mutate();
  };

  const isOverdue =
    task?.dueDate &&
    task.status !== "completed" &&
    task.status !== "cancelled" &&
    new Date(task.dueDate).getTime() < Date.now();

  return (
    <>
      <Breadcrumb pageName="Task Details" />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message="Delete this task permanently?"
        confirmLabel={deleteTaskMutation.isPending ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteTaskMutation.isPending}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteTaskMutation.mutate()}
      />

      <ConfirmationModal
        isOpen={showCompleteConfirm}
        title="Complete Task"
        message="Mark this task as completed?"
        confirmLabel={completeTaskMutation.isPending ? "Saving..." : "Mark Completed"}
        cancelLabel="Cancel"
        variant="primary"
        isLoading={completeTaskMutation.isPending}
        onCancel={() => setShowCompleteConfirm(false)}
        onConfirm={() => completeTaskMutation.mutate()}
      />

      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
            >
              <FiArrowLeft />
              Back to Tasks
            </Link>

            <div className="flex items-center gap-2">
              {task && task.status !== "completed" ? (
                <button
                  type="button"
                  onClick={() => setShowCompleteConfirm(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
                >
                  <FiCheckCircle />
                  Complete
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-300 px-3 py-2 text-sm font-semibold text-cyan-700 dark:border-cyan-700 dark:text-cyan-300"
              >
                <FiEdit2 />
                Edit
              </button>

              {canManage ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 dark:border-rose-700 dark:text-rose-300"
                >
                  <FiTrash2 />
                  Delete
                </button>
              ) : null}
            </div>
          </div>

          {taskQuery.isLoading ? (
            <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-500 dark:border-slate-700">Loading task...</div>
          ) : !task ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">Task not found.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">{task.title}</h1>
                {task.description ? (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{task.description}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={clsx("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", statusBadgeMap[task.status])}>
                  {task.status.replace("_", " ")}
                </span>
                <span className={clsx("rounded-full px-2.5 py-1 text-xs font-semibold uppercase", priorityBadgeMap[task.priority])}>
                  {task.priority}
                </span>
                {task.category ? (
                  <span className={clsx("rounded-full px-2.5 py-1 text-xs font-semibold", categoryBadgeMap[task.category])}>
                    {getDocumentCategoryLabel(task.category)}
                  </span>
                ) : null}
                {isOverdue ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                    <FiAlertCircle />
                    Overdue
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assignee</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    <FiUsers />
                    {task.assignedTo?.fullname || task.assignedTo?.username || "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned By</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    <FiUser />
                    {task.assignedBy?.fullname || task.assignedBy?.username || "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Due Date</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    <FiClock />
                    {parseIsoDate(task.dueDate)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Updated</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{parseIsoDate(task.updatedAt)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Linked Targets</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(task.linkedTargets || []).length === 0 ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400">No linked targets</span>
                  ) : (
                    (task.linkedTargets || []).map((link, index) => (
                      <span
                        key={`${task._id}-link-${index}`}
                        className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:border-cyan-800/50 dark:bg-cyan-900/20 dark:text-cyan-300"
                      >
                        <FiTarget />
                        {link.targetType}:{link.targetLabel || link.targetId}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {task.completionNote ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-sm text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                  Completion note: {task.completionNote}
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>

      {showEditModal ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/20 dark:text-cyan-300">
                  <FiEdit2 />
                  Edit Task
                </p>
                <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Update Task</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={onUpdateTask} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Task title"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                />

                <select
                  value={taskStatus}
                  onChange={(event) => setTaskStatus(event.target.value as TaskStatus)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
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
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                />

                {canManage ? (
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
                ) : null}
              </div>

              <textarea
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                placeholder="Description"
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
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateTaskMutation.isPending}
                  className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60"
                >
                  {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
