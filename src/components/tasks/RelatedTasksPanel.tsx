"use client";

import Link from "next/link";
import axios from "axios";
import clsx from "clsx";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiCalendar, FiLink2, FiPlus, FiTarget } from "react-icons/fi";

type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";
type TaskPriority = "low" | "medium" | "high" | "urgent";

type TaskItem = {
  _id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
};

type TaskResponse = {
  tasks: TaskItem[];
};

const statusBadgeMap: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export default function RelatedTasksPanel({
  targetType,
  targetId,
  targetLabel,
  className,
}: {
  targetType: string;
  targetId: string;
  targetLabel?: string;
  className?: string;
}) {
  const encodedLabel = encodeURIComponent(targetLabel || `${targetType} ${targetId}`);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tasks-related", targetType, targetId],
    queryFn: async () => {
      const params = new URLSearchParams({
        scope: "related",
        linkType: targetType,
        linkId: targetId,
        page: "0",
        limit: "8",
      });
      const response = await axios.get(`/api/tasks?${params.toString()}`);
      return response.data as TaskResponse;
    },
    enabled: Boolean(targetType && targetId),
    retry: false,
  });

  const tasks = useMemo(() => data?.tasks || [], [data?.tasks]);

  if (isError) {
    return null;
  }

  return (
    <section
      className={clsx(
        "rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-5 shadow-sm dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300">
            <FiTarget />
            Related Tasks
          </p>
          <h3 className="mt-2 text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
            Linked work items
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Tasks linked to this {targetType}
            {targetLabel ? `: ${targetLabel}` : ""}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/tasks/manage?linkType=${encodeURIComponent(targetType)}&linkId=${encodeURIComponent(targetId)}&linkLabel=${encodedLabel}`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <FiPlus />
            Create Linked Task
          </Link>
          <Link
            href={`/tasks/manage?status=&priority=&search=`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FiLink2 />
            Open Tasks
          </Link>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            Loading related tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            No tasks linked yet.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {task.title}
                </p>
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                    statusBadgeMap[task.status],
                  )}
                >
                  {task.status.replace("_", " ")}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <FiCalendar />
                {task.dueDate
                  ? `Due ${new Date(task.dueDate).toLocaleDateString()}`
                  : "No due date"}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
