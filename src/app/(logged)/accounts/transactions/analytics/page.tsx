"use client";

import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUserContext } from "@/contexts/UserContext";
import { hasPermission } from "@/auth/permissions";
import toast from "react-hot-toast";
import {
  FiActivity,
  FiArrowLeft,
  FiBarChart2,
  FiChevronRight,
  FiDollarSign,
  FiLayers,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";

type MonthlyCategory = {
  categoryId: string;
  categoryLabel: string;
  income: number;
  expense: number;
  balance: number;
};

type MonthlyPaymentMethod = {
  methodId: string;
  methodLabel: string;
  income: number;
  expense: number;
  balance: number;
};

type MonthlyStatsData = {
  year: number;
  month: number;
  totalTransactions: number;
  officeRecords: {
    totalIncome: number;
    totalExpense: number;
    byCategory?: MonthlyCategory[];
  };
  profit: number;
  netProfit: number;
  paymentMethods: MonthlyPaymentMethod[];
};

type MonthlyStatsListResponse = {
  success: boolean;
  summary: MonthlyStatsData[];
};

const formatCurrency = (value: number) => `AED ${Number(value || 0).toFixed(2)}`;

const monthLabel = (month: number, year: number) =>
  new Date(year, month - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });

function MetricCard({
  title,
  value,
  subtitle,
  tone,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  tone: "emerald" | "rose" | "cyan" | "amber" | "violet";
  icon: React.ReactNode;
}) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/20 dark:text-emerald-300",
    rose: "border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/20 dark:text-rose-300",
    cyan: "border-cyan-200 bg-cyan-50/80 text-cyan-700 dark:border-cyan-800/60 dark:bg-cyan-950/20 dark:text-cyan-300",
    amber: "border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/20 dark:text-amber-300",
    violet: "border-violet-200 bg-violet-50/80 text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/20 dark:text-violet-300",
  };

  return (
    <article className={clsx("rounded-3xl relative border p-5 shadow-sm backdrop-blur", tones[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-80">{title}</p>
          <p className="mt-3 min-w-[9ch] tabular-nums text-2xl font-black leading-none text-slate-950 dark:text-white">{value}</p>
          <p className="mt-2 text-xs font-medium opacity-80">{subtitle}</p>
        </div>
        <div className="flex absolute right-4 h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 p-2 shadow-sm dark:bg-slate-900/80">{icon}</div>
      </div>
    </article>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PieChart({
  slices,
  centerTitle,
  centerValue,
}: {
  slices: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  centerTitle: string;
  centerValue: string;
}) {
  const size = 220;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(slices.reduce((sum, slice) => sum + Math.max(slice.value, 0), 0), 1);
  let runningOffset = 0;

  return (
    <div className="space-y-4">
      <div className="relative mx-auto h-[220px] w-[220px] shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth={strokeWidth} />
          {slices.map((slice, index) => {
            const sliceLength = (Math.max(slice.value, 0) / total) * circumference;
            const dashArray = `${sliceLength} ${circumference - sliceLength}`;
            const dashOffset = circumference - runningOffset;
            runningOffset += sliceLength;
            return (
              <circle
                key={`${slice.label}-${index}`}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{centerTitle}</span>
          <span className="mt-1 text-xl font-black text-slate-900 dark:text-white">{centerValue}</span>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {slices.map((slice) => {
          const percent = ((Math.max(slice.value, 0) / total) * 100).toFixed(1);
          return (
            <div key={slice.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-950/30">
              <div className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 rounded-full" style={{ background: slice.color }} />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{slice.label}</span>
              </div>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">{percent}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineChart({
  labels,
  series,
}: {
  labels: string[];
  series: Array<{
    label: string;
    values: number[];
    color: string;
  }>;
}) {
  const width = 760;
  const height = 280;
  const allValues = series.flatMap((item) => item.values);
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const range = max - min || 1;
  const padding = 28;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-950/40">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + innerHeight - ratio * innerHeight;
          return <line key={ratio} x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 4" />;
        })}

        {series.map((entry) => {
          const path = entry.values
            .map((value, index) => {
              const x = padding + (index / Math.max(entry.values.length - 1, 1)) * innerWidth;
              const normalized = (value - min) / range;
              const y = padding + innerHeight - normalized * innerHeight;
              return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
            })
            .join(" ");

          return (
            <path
              key={entry.label}
              d={path}
              fill="none"
              stroke={entry.color}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {labels.map((label, index) => {
          const x = padding + (index / Math.max(labels.length - 1, 1)) * innerWidth;
          return (
            <text key={label} x={x} y={height - 6} textAnchor="middle" className="fill-slate-400 text-[10px] font-semibold">
              {label}
            </text>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-2">
        {series.map((entry) => (
          <span key={entry.label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
            {entry.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function FinanceAnalyticsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const permissions = Array.isArray(user?.permissions) ? (user.permissions as string[]) : [];
  const canViewFinanceSummary = hasPermission(permissions, "payments.view.finance-summary-page");

  const LIMITS = {
    paymentMethodRows: 6,
    topMethods: 5,
  } as const;

  const { data, isLoading, isError } = useQuery<MonthlyStatsListResponse>({
    queryKey: ["finance-summary-monthly-list"],
    enabled: canViewFinanceSummary,
    queryFn: async () => {
      const { data } = await axios.get("/api/payment/monthly-stats/list");
      return data;
    },
  });

  useEffect(() => {
    if (user && !canViewFinanceSummary) {
      router.push("/");
    }
  }, [user, canViewFinanceSummary, router]);

  const monthlyStats = useMemo(() => data?.summary ?? [], [data?.summary]);

  const sortedStats = useMemo(
    () => [...monthlyStats].sort((a, b) => a.year - b.year || a.month - b.month),
    [monthlyStats],
  );

  const latestStats = sortedStats[sortedStats.length - 1];
  const recentSix = sortedStats.slice(-6);
  const recentTwelve = sortedStats.slice(-12);

  const totals = useMemo(() => {
    return sortedStats.reduce(
      (acc, item) => {
        acc.transactions += Number(item.totalTransactions || 0);
        acc.income += Number(item.officeRecords?.totalIncome || 0);
        acc.officeExpense += Number(item.officeRecords?.totalExpense || 0);
        acc.profit += Number(item.profit || 0);
        acc.netProfit += Number(item.netProfit || 0);
        return acc;
      },
      { transactions: 0, income: 0, officeExpense: 0, profit: 0, netProfit: 0 },
    );
  }, [sortedStats]);

  const averages = useMemo(() => {
    const divisor = Math.max(sortedStats.length, 1);
    return {
      transactions: totals.transactions / divisor,
      income: totals.income / divisor,
      officeExpense: totals.officeExpense / divisor,
      profit: totals.profit / divisor,
      netProfit: totals.netProfit / divisor,
    };
  }, [sortedStats.length, totals]);

  const sixMonthTrend = useMemo(() => {
    const labels = recentSix.map((item) => monthLabel(item.month, item.year));
    return {
      labels,
      profit: recentSix.map((item) => Number(item.profit || 0)),
      officeExpense: recentSix.map((item) => Number(item.officeRecords?.totalExpense || 0)),
    };
  }, [recentSix]);

  const currentMonthCategories = latestStats?.officeRecords?.byCategory || [];
  const currentMonthMethods = [...(latestStats?.paymentMethods || [])].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  const currentMonthMethodsLimited = currentMonthMethods.slice(0, LIMITS.paymentMethodRows);
  const currentMonthTotalBalance = useMemo(
    () => currentMonthMethods.reduce((sum, method) => sum + Number(method.balance || 0), 0),
    [currentMonthMethods],
  );

  const isNetPositive = Number(latestStats?.netProfit || 0) >= 0;

  const monthShortLabels = sixMonthTrend.labels.map((label) => label.split(" ")[0]);

  const officeExpenseSlices = currentMonthCategories
    .map((category, index) => ({
      label: category.categoryLabel,
      value: Math.max(category.expense, 0),
      color: ["#F43F5E", "#FB7185", "#EC4899", "#F97316", "#8B5CF6", "#10B981", "#06B6D4", "#F59E0B"][index % 8],
    }))
    .filter((slice) => slice.value > 0);

  const handleRefresh = async () => {
    try {
      const [ledgerResponse, monthlyResponse] = await Promise.all([
        axios.post("/api/payment/entity-stats/recompute"),
        axios.post("/api/admin/payment/backfill-monthly-stats"),
      ]);

      const updatedEntities = Number(ledgerResponse?.data?.updatedEntities || 0);
      const updatedOfficeCategories = Number(ledgerResponse?.data?.updatedOfficeCategories || 0);
      const updatedLiabilityEntities = Number(ledgerResponse?.data?.updatedLiabilityEntities || 0);
      const monthlyComputedMonths = Number(monthlyResponse?.data?.computedMonths || 0);

      await queryClient.invalidateQueries({ queryKey: ["entity-record-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["finance-summary-monthly-list"] });
      await queryClient.invalidateQueries({ queryKey: ["finance-summary-monthly"] });
      await queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      await queryClient.refetchQueries({ queryKey: ["finance-summary-monthly-list"] });

      toast.success(
        `Refreshed precomputed stats (${updatedEntities} entities, ${updatedOfficeCategories} office categories, ${updatedLiabilityEntities} liability entities, ${monthlyComputedMonths} monthly periods)`,
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to refresh finance summary");
    }
  };

  if (!user || !canViewFinanceSummary) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 md:p-6 2xl:p-10">
      <Breadcrumb pageName="Finance Summary" />

      <section className="relative overflow-hidden rounded-3xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 shadow-sm dark:border-cyan-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 md:p-7">
        <div className="pointer-events-none absolute -left-20 -top-16 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-emerald-300/25 blur-3xl" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300">
              <FiBarChart2 /> Monthly Finance Intelligence
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-slate-50">Financial Summary</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 shadow-sm transition hover:bg-cyan-50 dark:border-cyan-700 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-slate-800"
            >
              <FiBarChart2 /> Refresh Precomputations
            </button>
            <Link
              href="/accounts/transactions"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FiArrowLeft /> Back to Transactions
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Transactions"
          value={isLoading ? "..." : totals.transactions.toLocaleString() + " Transactions"}
          subtitle={`Average ${averages.transactions.toFixed(0)} transactions per month`}
          tone="cyan"
          icon={<FiActivity className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />}
        />
        <MetricCard
          title="Total Balance"
          value={isLoading ? "..." : formatCurrency(currentMonthTotalBalance)}
          subtitle="Current month total across payment methods"
          tone="emerald"
          icon={<FiDollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />}
        />
        <MetricCard
          title="Office Expense"
          value={isLoading ? "..." : formatCurrency(totals.officeExpense)}
          subtitle={`Average ${formatCurrency(averages.officeExpense)} per month`}
          tone="rose"
          icon={<FiTrendingDown className="h-6 w-6 text-rose-600 dark:text-rose-300" />}
        />
        <MetricCard
          title="Profit"
          value={isLoading ? "..." : formatCurrency(totals.profit)}
          subtitle="Precomputed monthly profit total"
          tone="amber"
          icon={<FiTrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-300" />}
        />
        <MetricCard
          title="Net Profit"
          value={isLoading ? "..." : formatCurrency(totals.netProfit)}
          subtitle="Profit after office expense"
          tone="violet"
          icon={<FiLayers className="h-6 w-6 text-violet-600 dark:text-violet-300" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard title="Office Expense Pie" subtitle={`Category split for ${latestStats ? monthLabel(latestStats.month, latestStats.year) : "the latest month"}`}>
          {officeExpenseSlices.length > 0 ? (
            <PieChart
              slices={officeExpenseSlices}
              centerTitle="Office Expense"
              centerValue={formatCurrency(officeExpenseSlices.reduce((sum, slice) => sum + slice.value, 0))}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
              No category expense data in current month.
            </div>
          )}
        </ChartCard>

        <ChartCard title="Current Month Pulse" subtitle={latestStats ? monthLabel(latestStats.month, latestStats.year) : "No month loaded"}>
          {latestStats ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-emerald-50 p-5 text-slate-900 ring-1 ring-cyan-100 dark:from-slate-950 dark:to-cyan-950 dark:text-white dark:ring-cyan-900/40">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">Net Profit</p>
                <p className={clsx("mt-2 text-3xl font-black", isNetPositive ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300")}>
                  {formatCurrency(latestStats.netProfit)}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-cyan-100/80">
                  {isNetPositive ? "Positive momentum" : "Needs attention"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/40">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Profit</p>
                  <p className="mt-2 text-lg font-black text-emerald-600 dark:text-emerald-300">{formatCurrency(latestStats.profit)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/40">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Office Expense</p>
                  <p className="mt-2 text-lg font-black text-rose-600 dark:text-rose-300">{formatCurrency(latestStats.officeRecords.totalExpense)}</p>
                </div>
              </div>

              <Link
                href={`/accounts/transactions/analytics/${latestStats.year}/${latestStats.month}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-300"
              >
                Open month detail <FiChevronRight />
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
              No monthly stats available yet.
            </div>
          )}
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard title="Six-Month Trend" subtitle="Profit and office expense for the last 6 months including this month">
          {sixMonthTrend.labels.length > 0 ? (
            <LineChart
              labels={monthShortLabels}
              series={[
                { label: "Profit", values: sixMonthTrend.profit, color: "#10B981" },
                { label: "Office Expense", values: sixMonthTrend.officeExpense, color: "#F43F5E" },
              ]}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
              No monthly stats found.
            </div>
          )}
        </ChartCard>

        <ChartCard title="Top Payment Methods" subtitle={`Latest month balances (showing ${Math.min(currentMonthMethodsLimited.length, LIMITS.paymentMethodRows)} of ${currentMonthMethods.length})`}>
          {currentMonthMethods.length > 0 ? (
            <div className="space-y-4">
              {currentMonthMethodsLimited.map((method) => {
                const magnitude = Math.max(Math.abs(method.balance), 1);
                const positive = method.balance >= 0;
                const methodColor = positive ? "#10B981" : "#F43F5E";

                return (
                  <div key={method.methodId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/40">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: methodColor }}>
                          <FiDollarSign className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate font-semibold text-slate-800 dark:text-slate-100">{method.methodLabel}</span>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400">Income {formatCurrency(method.income)} · Expense {formatCurrency(method.expense)}</span>
                        </div>
                      </div>
                      <span className={clsx("font-bold tabular-nums", positive ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300")}>
                        {formatCurrency(method.balance)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max((magnitude / Math.max(...currentMonthMethods.map((row) => Math.abs(row.balance)), 1)) * 100, 8)}%`,
                          background: methodColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {currentMonthMethods.length > LIMITS.paymentMethodRows && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300">
                  Payment methods are intentionally capped here to keep the dashboard compact.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
              No payment method data in current month.
            </div>
          )}
        </ChartCard>
      </section>

      {isError && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
          Failed to load monthly stats.
        </section>
      )}
    </div>
  );
}