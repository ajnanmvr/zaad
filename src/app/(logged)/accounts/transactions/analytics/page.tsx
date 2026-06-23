"use client";

import { hasPermission } from "@/auth/permissions";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import AdminRefreshButton from "@/components/common/AdminRefreshButton";
import { getPaymentMethodIcon } from "@/config/paymentMethodIcons";
import { useUserContext } from "@/contexts/UserContext";
import { formatDubaiMonthLabel } from "@/utils/dubaiTime";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FiActivity,
  FiArrowLeft,
  FiArrowRight,
  FiBarChart2,
  FiChevronRight,
  FiDollarSign,
  FiFileText,
  FiLayers,
  FiTrendingDown,
  FiTrendingUp,
  FiZap,
} from "react-icons/fi";

type MonthlyCategory = {
  categoryId: string;
  categoryLabel: string;
  income: number;
  expense: number;
  balance: number;
};

type MonthlyPaymentMethod = {
  method?: string | null;
  methodId: string;
  methodLabel: string;
  methodColor?: string;
  methodIcon?: string;
  income: number;
  expense: number;
  net?: number;
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

const monthLabel = (month: number, year: number) => formatDubaiMonthLabel(year, month);

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
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{slice.label}</span>
              </div>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">{percent}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AreaLineChart({
  labels,
  fullLabels,
  series,
}: {
  labels: string[];
  fullLabels: string[];
  series: Array<{ label: string; values: number[]; color: string }>;
}) {
  const W = 880;
  const H = 300;
  const PX = 56;
  const PY = 20;
  const PB = 32;
  const innerW = W - PX * 2;
  const innerH = H - PY - PB;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const allVals = series.flatMap((s) => s.values);
  const rawMax = Math.max(...allVals, 0);
  const rawMin = Math.min(...allVals, 0);
  const spread = (rawMax - rawMin) * 0.15;
  const vMax = rawMax + spread;
  const vMin = Math.min(rawMin - spread * 0.5, 0);
  const vRange = vMax - vMin || 1;

  const activeIdx = hovered ?? labels.length - 1;

  const xOf = (i: number) => PX + (i / Math.max(labels.length - 1, 1)) * innerW;
  const yOf = (v: number) => PY + innerH - ((v - vMin) / vRange) * innerH;

  const bezierPath = (values: number[]) => {
    if (values.length === 0) return "";
    if (values.length === 1) return `M${xOf(0).toFixed(1)},${yOf(values[0]).toFixed(1)}`;
    let d = `M${xOf(0).toFixed(1)},${yOf(values[0]).toFixed(1)}`;
    for (let i = 1; i < values.length; i++) {
      const x0 = xOf(i - 1); const y0 = yOf(values[i - 1]);
      const x1 = xOf(i); const y1 = yOf(values[i]);
      const cpx = (x0 + x1) / 2;
      d += ` C${cpx.toFixed(1)},${y0.toFixed(1)} ${cpx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
    }
    return d;
  };

  const areaPath = (values: number[]) => {
    const base = yOf(Math.max(vMin, 0));
    return `${bezierPath(values)} L${xOf(values.length - 1).toFixed(1)},${base.toFixed(1)} L${xOf(0).toFixed(1)},${base.toFixed(1)} Z`;
  };

  const resolveIdx = (clientX: number) => {
    if (!svgRef.current || labels.length === 0) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(labels.length - 1, Math.round(ratio * (labels.length - 1))));
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => vMin + r * vRange);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: "clamp(180px, 30vw, 300px)" }}
        onMouseMove={(e) => setHovered(resolveIdx(e.clientX))}
        onMouseLeave={() => setHovered(null)}
        onTouchMove={(e) => { const t = e.touches[0]; if (t) setHovered(resolveIdx(t.clientX)); }}
        onTouchEnd={() => setHovered(null)}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.label} id={`grad-${s.label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.01" />
            </linearGradient>
          ))}
        </defs>

        {/* Grid lines + Y labels */}
        {yTicks.map((v, i) => {
          const y = yOf(v);
          const label = Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0);
          return (
            <g key={i}>
              <line x1={PX} y1={y} x2={W - PX} y2={y} stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} />
              <text x={PX - 8} y={y + 4} textAnchor="end" fontSize={10} fill="currentColor" fillOpacity={0.35}>{label}</text>
            </g>
          );
        })}

        {/* Area fills */}
        {series.map((s) => (
          <path key={`area-${s.label}`} d={areaPath(s.values)} fill={`url(#grad-${s.label})`} />
        ))}

        {/* Lines */}
        {series.map((s) => (
          <path key={`line-${s.label}`} d={bezierPath(s.values)} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* Active crosshair */}
        {activeIdx !== null && (
          <line x1={xOf(activeIdx)} y1={PY} x2={xOf(activeIdx)} y2={PY + innerH} stroke="currentColor" strokeOpacity={0.12} strokeWidth={1.5} strokeDasharray="4 3" />
        )}

        {/* Dots */}
        {series.map((s) =>
          s.values.map((v, i) => {
            const isActive = i === activeIdx;
            return (
              <g key={`dot-${s.label}-${i}`}>
                {isActive && <circle cx={xOf(i)} cy={yOf(v)} r={12} fill={s.color} fillOpacity={0.12} />}
                <circle cx={xOf(i)} cy={yOf(v)} r={isActive ? 5.5 : 2.5} fill={s.color} fillOpacity={isActive ? 1 : 0.45} />
              </g>
            );
          }),
        )}

        {/* X labels */}
        {labels.map((label, i) => (
          <text
            key={`xl-${i}`}
            x={xOf(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize={10}
            fill="currentColor"
            fillOpacity={i === activeIdx ? 0.8 : 0.3}
            fontWeight={i === activeIdx ? "700" : "500"}
          >
            {label}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {activeIdx !== null && labels[activeIdx] && (
        <div
          className="pointer-events-none absolute top-1 z-10 min-w-[160px] rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-none"
          style={{ left: `clamp(4px, calc(${(activeIdx / Math.max(labels.length - 1, 1)) * 100}% - 80px), calc(100% - 170px))` }}
        >
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{fullLabels[activeIdx]}</p>
          {series.map((s) => (
            <div key={s.label} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="text-xs font-black tabular-nums" style={{ color: s.color }}>{formatCurrency(s.values[activeIdx] ?? 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FinanceAnalyticsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const permissions = user?.permissions && Array.isArray(user.permissions) ? (user.permissions as string[]) : [];
  const canViewFinanceSummary = user ? hasPermission(permissions, "payments.view.finance-summary-page") || hasPermission(permissions, "payments.view.finance") || hasPermission(permissions, "payments.view.reports") : false;
  const canAdminRefresh = user ? hasPermission(permissions, "payments.manage.recompute-monthly-stats") || hasPermission(permissions, "payments.admin") || hasPermission(permissions, "admin.access") : false;

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

  const { data: financeSummaryData } = useQuery<{ summary: { totalTransactions: number; todayProfit: number } }>({
    queryKey: ["finance-summary"],
    enabled: canViewFinanceSummary,
    queryFn: async () => {
      const { data } = await axios.get("/api/payment/finance-summary");
      return data;
    },
  });

  useEffect(() => {
    if (user && !canViewFinanceSummary) {
      router.push("/not-permitted");
    }
  }, [user, canViewFinanceSummary, router]);

  const [trendWindow, setTrendWindow] = useState<"6m" | "1y" | "total">("6m");

  const monthlyStats = useMemo(() => data?.summary ?? [], [data?.summary]);

  const sortedStats = useMemo(
    () => [...monthlyStats].sort((a, b) => a.year - b.year || a.month - b.month),
    [monthlyStats],
  );

  const latestStats = sortedStats[sortedStats.length - 1];

  const trendSlice = useMemo(() => {
    if (trendWindow === "6m") return sortedStats.slice(-6);
    if (trendWindow === "1y") return sortedStats.slice(-12);
    return sortedStats.filter((item) => item.year > 2024 || (item.year === 2024 && item.month >= 7));
  }, [sortedStats, trendWindow]);

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

  const trendData = useMemo(() => {
    const labels = trendSlice.map((item) => monthLabel(item.month, item.year));
    return {
      labels,
      profit: trendSlice.map((item) => Number(item.profit || 0)),
      officeExpense: trendSlice.map((item) => Number(item.officeRecords?.totalExpense || 0)),
    };
  }, [trendSlice]);

  const currentMonthCategories = latestStats?.officeRecords?.byCategory || [];
  const currentMonthMethods = [...(latestStats?.paymentMethods || [])].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  const currentMonthMethodsLimited = currentMonthMethods.slice(0, LIMITS.paymentMethodRows);
  const currentMonthTotalBalance = useMemo(
    () => currentMonthMethods.reduce((sum, method) => sum + Number(method.balance || 0), 0),
    [currentMonthMethods],
  );

  const isNetPositive = Number(latestStats?.netProfit || 0) >= 0;

  const todayProfit = financeSummaryData?.summary?.todayProfit ?? null;
  const currentYear = new Date().getFullYear();
  const trendChartLabels = trendSlice.map((item) => {
    const mo = monthLabel(item.month, item.year).split(" ")[0];
    return item.year === currentYear ? mo : `${mo} ${String(item.year).slice(2)}`;
  });

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
            <Link
              href="/accounts/transactions/reports"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800"
            >
              <FiFileText /> Reports
            </Link>
            {canAdminRefresh && (
              <AdminRefreshButton
                invalidateKeys={["entity-record-stats", "finance-summary-monthly-list", "finance-summary-monthly", "finance-summary"]}
                label="Refresh Precomputations"
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 shadow-sm transition hover:bg-cyan-50 dark:border-cyan-700 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-slate-800"
              />
            )}
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

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
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

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100">This Month</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {latestStats ? monthLabel(latestStats.month, latestStats.year) : "No data"}
                </p>
              </div>
              {latestStats && (
                <Link
                  href={`/accounts/transactions/analytics/${latestStats.year}/${latestStats.month}`}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Full detail <FiArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>

          {latestStats ? (
            <div className="p-5 space-y-3">
              {/* Net profit hero */}
              <div className={clsx(
                "relative overflow-hidden rounded-2xl p-5",
                isNetPositive
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                  : "bg-gradient-to-br from-rose-500 to-pink-600"
              )}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Net Profit</p>
                <p className="mt-1.5 text-3xl font-black tabular-nums text-white">{formatCurrency(latestStats.netProfit)}</p>
                <p className="mt-2 text-xs text-white/60">{isNetPositive ? "↑ Positive month" : "↓ Needs attention"}</p>
              </div>

              {/* Profit + Expense */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-50 p-3.5 dark:bg-emerald-950/30">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Profit</p>
                  <p className="mt-1.5 text-base font-black tabular-nums text-emerald-700 dark:text-emerald-300">{formatCurrency(latestStats.profit)}</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3.5 dark:bg-rose-950/30">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-600 dark:text-rose-400">Expenses</p>
                  <p className="mt-1.5 text-base font-black tabular-nums text-rose-700 dark:text-rose-300">{formatCurrency(latestStats.officeRecords.totalExpense)}</p>
                </div>
              </div>

              {/* Transactions */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-2.5">
                  <FiActivity className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Transactions</span>
                </div>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100">{(latestStats.totalTransactions || 0).toLocaleString()}</span>
              </div>

              {/* Today's profit */}
              <div className="flex items-center justify-between rounded-xl border border-amber-200/70 bg-amber-50 px-4 py-3 dark:border-amber-800/30 dark:bg-amber-950/20">
                <div className="flex items-center gap-2.5">
                  <FiZap className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Today&apos;s Profit</span>
                </div>
                <span className="text-sm font-black tabular-nums text-amber-700 dark:text-amber-300">
                  {todayProfit === null ? "…" : formatCurrency(todayProfit)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center p-5 text-sm text-slate-400">
              No monthly stats available yet.
            </div>
          )}
        </div>

        <ChartCard title="Top Payment Methods" subtitle={`Latest month balances (showing ${Math.min(currentMonthMethodsLimited.length, LIMITS.paymentMethodRows)} of ${currentMonthMethods.length})`}>
          {currentMonthMethods.length > 0 ? (
            <>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/40">
                    <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMonthMethodsLimited.map((method) => {
                      const positive = Number(method.balance || 0) >= 0;
                      const methodColor = String(method.methodColor || "").trim() || "#64748B";
                      const MethodIcon = getPaymentMethodIcon(method.methodIcon);
                      const netValue = Number(method.net ?? Number(method.income || 0) - Number(method.expense || 0));

                      return (
                        <tr key={method.methodId} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                          <td className="px-4 py-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: methodColor }}>
                                <MethodIcon className="h-4 w-4" />
                              </div>
                              <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{method.methodLabel}</span>
                            </div>
                          </td>
                          <td className={clsx("px-4 py-3 text-right text-sm font-bold tabular-nums", positive ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300")}>{formatCurrency(method.balance)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3">
                {currentMonthMethods.length > LIMITS.paymentMethodRows && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300">
                    Payment methods are intentionally capped here to keep the dashboard compact.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
              No payment method data in current month.
            </div>
          )}
        </ChartCard>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
              {trendWindow === "6m" ? "Performance Overview" : trendWindow === "1y" ? "Annual Performance" : "All-Time Performance"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Profit vs office expense —{" "}
              {trendWindow === "6m" ? "last 6 months" : trendWindow === "1y" ? "last 12 months" : "Jul 2024 to now"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Profit</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />Expense</span>
            </div>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
              {(["6m", "1y", "total"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTrendWindow(option)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${trendWindow === option ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
                >
                  {option === "6m" ? "6M" : option === "1y" ? "1Y" : "All"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4">
          {trendChartLabels.length > 0 ? (
            <AreaLineChart
              labels={trendChartLabels}
              fullLabels={trendData.labels}
              series={[
                { label: "Profit", values: trendData.profit, color: "#10B981" },
                { label: "Expense", values: trendData.officeExpense, color: "#F43F5E" },
              ]}
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-700">
              No monthly data found.
            </div>
          )}
        </div>
      </section>

      {isError && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
          Failed to load monthly stats.
        </section>
      )}
    </div>
  );
}