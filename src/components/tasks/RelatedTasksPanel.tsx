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

const priorityBadgeMap: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  urgent: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
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

      <div className="mt-4">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            Loading related tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            No tasks linked yet.
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40">
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="min-w-[280px] px-4 pb-3 pt-3">Task</th>
                  <th className="min-w-[120px] px-4 pb-3">Status</th>
                  <th className="min-w-[120px] px-4 pb-3">Priority</th>
                  <th className="min-w-[140px] px-4 pb-3">Due Date</th>
                  <th className="min-w-[100px] px-4 pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task._id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {task.title}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "rounded-full px-2 py-1 text-xs font-semibold capitalize",
                          statusBadgeMap[task.status],
                        )}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "rounded-full px-2 py-1 text-xs font-semibold uppercase",
                          priorityBadgeMap[task.priority],
                        )}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <FiCalendar className="text-slate-400" />
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Link
                          href={`/tasks/${task._id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-cyan-300 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 dark:border-cyan-700 dark:text-cyan-300"
                        >
                          Open
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
