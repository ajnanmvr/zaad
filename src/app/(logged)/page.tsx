"use client";

import dynamic from "next/dynamic";
import axios from "axios";
import Link from "next/link";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { ApexOptions } from "apexcharts";
import { TDashboardOverview } from "@/types/dashboard";
import { useUserContext } from "@/contexts/UserContext";
import {
  FiAlertCircle,
  FiArrowUpRight,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiTrendingDown,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import PrintReportButton from "@/components/common/PrintReportButton";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const formatTaskDate = (value?: string | null) => {
  if (!value) return "No due date";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "No due date";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusBadgeMap: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const priorityBadgeMap: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  urgent: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export default function Home() {
  const { user, isUserLoading } = useUserContext();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<TDashboardOverview>({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const response = await axios.get("/api/dashboard/overview");
      return response.data;
    },
    enabled: !isUserLoading && Boolean(user),
    retry: 2,
  });

  if (isUserLoading || isLoading || (!data && isFetching)) {
    return (
      <div className="flex h-[65vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="mx-auto flex h-[65vh] max-w-xl flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Dashboard data is still syncing after login. Please retry.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const counts = data?.counts || { companies: 0, employees: 0, individuals: 0 };
  const documentStats =
    data?.documentStats ||
    {
      total: 0,
      expired: 0,
      renewal: 0,
      valid: 0,
      renewedThisMonth: 0,
      expiringNext30Days: 0,
    };
  const upcomingTasks = data?.upcomingTasks || [];
  const taskSummary = data?.taskSummary || { open: 0, inProgress: 0, completed: 0, overdue: 0 };

  const expiryBarOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false } },
    colors: ["#EF4444", "#F59E0B", "#22C55E"],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
      },
    },
    xaxis: {
      categories: ["Expired", "Renewal", "Valid"],
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: { borderColor: "#E2E8F0" },
  };

  const categoryRenewalsOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false } },
    colors: ["#EF4444", "#F59E0B"],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 6,
        columnWidth: "48%",
      },
    },
    xaxis: {
      categories: (data?.categoryExpiryRenewalBreakdown || []).map((row) => row.category),
    },
    yaxis: {
      labels: {
        formatter: (value) => `${Math.round(value)}`,
      },
    },
    legend: { position: "top" },
    dataLabels: { enabled: false },
    grid: { borderColor: "#E2E8F0" },
  };

  const monthlyRenewalsOptions: ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: { curve: "smooth", width: 3 },
    colors: ["#06B6D4"],
    xaxis: {
      categories: (data?.monthlyRenewals || []).map((row) => row.month),
    },
    yaxis: {
      labels: {
        formatter: (value) => `${Math.round(value)}`,
      },
    },
    dataLabels: { enabled: false },
    grid: { borderColor: "#E2E8F0" },
  };

  return (
    <div id="financial-report-root" className="mx-auto max-w-screen-2xl space-y-6 p-4 md:p-6 2xl:p-10">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 shadow-sm dark:border-cyan-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 md:p-7">
        <div className="pointer-events-none absolute -left-20 -top-16 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-emerald-300/25 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300">
              Live Operations Dashboard
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Business Pulse and Renewal Intelligence
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600 dark:text-slate-400">
              Unified insight into entities, document expiries, renewals, and your upcoming tasks.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <FiCalendar />
              Open Task Calendar
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <MetricCard label="Companies" value={String(counts.companies)} icon={<FiBriefcase />} tone="sky" />
        <MetricCard label="Employees" value={String(counts.employees)} icon={<FiUsers />} tone="emerald" />
        <MetricCard label="Individuals" value={String(counts.individuals)} icon={<FiUser />} tone="amber" />
        <MetricCard label="Total Expiries" value={String(documentStats.expired)} icon={<FiAlertCircle />} tone="rose" />
        <MetricCard label="Renewals" value={String(documentStats.renewal)} icon={<FiCheckCircle />} tone="violet" />
        <MetricCard label="Renewed This Month" value={String(documentStats.renewedThisMonth)} icon={<FiArrowUpRight />} tone="teal" />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Category-wise Expired vs Renewal</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Comparison of expired and renewal documents across Visa, License, and Other categories.</p>
          <div className="mt-4">
            <ReactApexChart
              type="bar"
              height={300}
              options={categoryRenewalsOptions}
              series={[
                {
                  name: "Expired",
                  data: (data?.categoryExpiryRenewalBreakdown || []).map((row) => row.expired),
                },
                {
                  name: "Renewal",
                  data: (data?.categoryExpiryRenewalBreakdown || []).map((row) => row.renewal),
                },
              ]}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Expiry Snapshot</h3>
          <div className="mt-4 space-y-3 text-sm">
            <StatRow label="Total Documents" value={String(documentStats.total)} icon={<FiBriefcase />} />
            <StatRow label="Expiring in 30 Days" value={String(documentStats.expiringNext30Days)} icon={<FiClock />} />
            <StatRow label="Current Open Tasks" value={String(taskSummary.open)} icon={<FiAlertCircle />} />
            <StatRow label="Overdue Tasks" value={String(taskSummary.overdue)} icon={<FiTrendingDown />} />
            <StatRow label="Completed Tasks" value={String(taskSummary.completed)} icon={<FiCheckCircle />} />
            <StatRow label="In Progress Tasks" value={String(taskSummary.inProgress)} icon={<FiCalendar />} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 xl:col-span-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Renewals Trend (Last 6 Months)</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">How many documents were renewed by month.</p>
          <div className="mt-4">
            <ReactApexChart
              type="line"
              height={320}
              options={monthlyRenewalsOptions}
              series={[
                {
                  name: "Renewed",
                  data: (data?.monthlyRenewals || []).map((row) => row.count),
                },
              ]}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Upcoming Tasks</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your nearest due tasks in priority order.</p>

          <div className="mt-4 space-y-3">
            {upcomingTasks.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No upcoming tasks assigned right now.
              </div>
            )}

            {upcomingTasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{task.title}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Due: {formatTaskDate(task.dueDate)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-bold uppercase", statusBadgeMap[task.status] || statusBadgeMap.todo)}>
                    {task.status.replace("_", " ")}
                  </span>
                  <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-bold uppercase", priorityBadgeMap[task.priority] || priorityBadgeMap.medium)}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/tasks"
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            View all tasks
            <FiArrowUpRight />
          </Link>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "sky" | "emerald" | "amber" | "rose" | "violet" | "teal";
}) {
  const toneMap: Record<string, string> = {
    sky: "border-sky-200/70 bg-sky-50/80 text-sky-700 dark:border-sky-900/30 dark:bg-sky-950/20 dark:text-sky-300",
    emerald: "border-emerald-200/70 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300",
    amber: "border-amber-200/70 bg-amber-50/80 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300",
    rose: "border-rose-200/70 bg-rose-50/80 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300",
    violet: "border-violet-200/70 bg-violet-50/80 text-violet-700 dark:border-violet-900/30 dark:bg-violet-950/20 dark:text-violet-300",
    teal: "border-teal-200/70 bg-teal-50/80 text-teal-700 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300",
  };

  return (
    <div className={clsx("rounded-2xl border p-4", toneMap[tone])}>
      <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em]">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function StatRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
      <p className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
          {icon}
        </span>
        {label}
      </p>
      <p className="text-sm font-black text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
