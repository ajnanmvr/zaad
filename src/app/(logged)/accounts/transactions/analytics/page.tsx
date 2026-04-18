"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { ApexOptions } from "apexcharts";
import { TAccountsData } from "@/types/dashboard";
import {
  FiActivity,
  FiBarChart2,
  FiCalendar,
  FiChevronDown,
  FiFilter,
  FiPieChart,
  FiRefreshCw,
  FiTrendingDown,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import clsx from "clsx";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const baseFilter = {
  mode: "current" as "current" | "year" | "month" | "range",
  m: "",
  y: "",
  from: "",
  to: "",
};

const formatCurrency = (value: number) => `${(value || 0).toFixed(2)} AED`;

const toTitleCase = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const currentMonthYearLabel = new Date().toLocaleString("en-US", {
  month: "long",
  year: "numeric",
});
const currentYear = new Date().getFullYear();
const startYear = 2024;
const yearOptions = Array.from(
  { length: Math.max(currentYear - startYear + 1, 1) },
  (_, index) => String(startYear + index),
);

const monthLabel = (m: string) => {
  const map: Record<string, string> = {
    "1": "January",
    "2": "February",
    "3": "March",
    "4": "April",
    "5": "May",
    "6": "June",
    "7": "July",
    "8": "August",
    "9": "September",
    "10": "October",
    "11": "November",
    "12": "December",
  };
  return map[m] ?? "Unknown";
};

const queryFromFilter = (filter: typeof baseFilter) => {
  if (filter.mode === "range") {
    if (filter.from && filter.to) return `?from=${filter.from}&to=${filter.to}`;
    if (filter.from) return `?from=${filter.from}`;
    if (filter.to) return `?to=${filter.to}`;
  }

  if (filter.mode === "year" && filter.y) {
    return `?y=${filter.y}`;
  }

  if (filter.mode === "month") {
    if (filter.m && filter.y) return `?m=${filter.m}&y=${filter.y}`;
    if (filter.m) return `?m=${filter.m}`;
    if (filter.y) return `?y=${filter.y}`;
  }

  return "";
};

export default function AccountsAnalyticsPage() {
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [draft, setDraft] = useState({ ...baseFilter });
  const [filter, setFilter] = useState({ ...baseFilter });

  const query = useMemo(() => queryFromFilter(filter), [filter]);

  const { data: accountsData, isLoading } = useQuery<TAccountsData>({
    queryKey: ["accounts-analytics-immersive", query],
    queryFn: async () => {
      const { data } = await axios.get(`/api/payment/accounts${query}`);
      return data;
    },
  });

  const filterDisplay = useMemo(() => {
    if (filter.mode === "range" && filter.from && filter.to) {
      return `${filter.from} to ${filter.to}`;
    }
    if (filter.mode === "year" && filter.y) {
      return `Year ${filter.y}`;
    }
    if (filter.mode === "month") {
      if (filter.m && filter.y) return `${monthLabel(filter.m)} ${filter.y}`;
      if (filter.m) return `${monthLabel(filter.m)} (current year)`;
      if (filter.y) return `Year ${filter.y}`;
    }
    return currentMonthYearLabel;
  }, [filter]);

  const rangeInvalid =
    draft.mode === "range" &&
    ((!draft.from && !draft.to) || (draft.from && draft.to && draft.from > draft.to));
  const yearInvalid = draft.mode === "year" && !draft.y.trim();
  const monthInvalid = draft.mode === "month" && !draft.m && !draft.y.trim();
  const disableApply = rangeInvalid || yearInvalid || monthInvalid;

  const applyFilter = () => {
    setFilter({ ...draft });
    setFilterOpen(false);
  };

  const resetCurrentMonth = () => {
    setFilter({ ...baseFilter });
    setDraft({ ...baseFilter });
    setFilterOpen(false);
  };

  const methodRows = useMemo(() => {
    const rows = accountsData?.methodBreakdown || [];
    return rows.map((row) => ({
      key: row.method,
      method: toTitleCase(row.method),
      income: row.income,
      expense: row.expense,
      balance: row.balance,
    }));
  }, [accountsData?.methodBreakdown]);

  const incomeAmount = accountsData?.totalIncomeAmount ?? 0;
  const expenseAmount = accountsData?.totalExpenseAmount ?? 0;
  const netBalance = accountsData?.totalBalance ?? 0;
  const netProfit = accountsData?.profitAfterOfficeExpenses ?? accountsData?.netProfit ?? 0;
  const grossProfit = accountsData?.grossProfit ?? accountsData?.profit ?? 0;

  const ratioOptions: ApexOptions = {
    chart: { type: "donut", toolbar: { show: false } },
    labels: ["Income", "Expense"],
    colors: ["#10B981", "#F43F5E"],
    legend: { position: "bottom", fontSize: "12px" },
    dataLabels: { enabled: false },
    stroke: { colors: ["#ffffff"], width: 2 },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Net",
              formatter: () => formatCurrency(netBalance),
            },
          },
        },
      },
    },
  };

  const methodBarOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, stacked: false },
    colors: ["#10B981", "#F43F5E"],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 6,
        columnWidth: "48%",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: methodRows.map((item) => item.method),
      labels: { rotate: -20 },
    },
    yaxis: {
      labels: {
        formatter: (value) => `${Math.round(value)}`,
      },
    },
    legend: { position: "top", horizontalAlign: "left" },
    grid: { borderColor: "#E2E8F0" },
  };

  const dailyTrend = accountsData?.dailyTrend || [];
  const dailyTrendOptions: ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false } },
    colors: ["#10B981", "#F43F5E"],
    stroke: { curve: "smooth", width: 2 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: dailyTrend.map((item) => item.date.slice(5)),
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
      },
    },
    legend: { position: "top", horizontalAlign: "left" },
    grid: { borderColor: "#E2E8F0" },
  };

  const statusRows = accountsData?.statusBreakdown || [];
  const statusOptions: ApexOptions = {
    chart: { type: "bar", stacked: true, toolbar: { show: false } },
    colors: ["#0EA5E9", "#F97316"],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: statusRows.map((item) => toTitleCase(item.status)),
    },
    legend: { position: "top", horizontalAlign: "left" },
    grid: { borderColor: "#E2E8F0" },
  };

  const topEntities = accountsData?.topEntities || [];
  const topEntityOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false } },
    colors: ["#6366F1"],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 5,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: topEntities.map((item) => item.label),
    },
    grid: { borderColor: "#E2E8F0" },
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 shadow-sm dark:border-sky-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-300/60 bg-sky-100/80 px-3 py-1 text-xs font-black uppercase tracking-wider text-sky-700 dark:border-sky-700/40 dark:bg-sky-900/30 dark:text-sky-300">
              <FiBarChart2 />
              Immersive Finance Analytics
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Transactions Intelligence Hub
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600 dark:text-slate-400">
              Live visual analytics connected to payment APIs with trend, ratio, method, status, and counterparty insights.
            </p>
          </div>

          <button
            onClick={() => setFilterOpen(true)}
            className="inline-flex min-w-[250px] items-center justify-between gap-3 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <span className="inline-flex items-center gap-2">
              <FiFilter />
              {filterDisplay}
            </span>
            <FiChevronDown />
          </button>
        </div>
      </section>

      {isFilterOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-8">
            <h3 className="mb-6 text-xl font-black text-slate-900 dark:text-white">Analytics Filter</h3>

            <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-4">
              <button
                onClick={() => setDraft({ ...draft, mode: "current", m: "", y: "", from: "", to: "" })}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  draft.mode === "current"
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {currentMonthYearLabel}
              </button>
              <button
                onClick={() => setDraft({ ...draft, mode: "year", m: "", from: "", to: "" })}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  draft.mode === "year"
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                Year
              </button>
              <button
                onClick={() => setDraft({ ...draft, mode: "month", from: "", to: "" })}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  draft.mode === "month"
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                Month / Year
              </button>
              <button
                onClick={() => setDraft({ ...draft, mode: "range", m: "", y: "" })}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  draft.mode === "range"
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                Custom Date Range
              </button>
            </div>

            {draft.mode === "year" && (
              <div className="mb-6">
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Year</label>
                <select
                  value={draft.y}
                  onChange={(e) => setDraft({ ...draft, y: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Select year</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {draft.mode === "month" && (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Month</label>
                  <select
                    value={draft.m}
                    onChange={(e) => setDraft({ ...draft, m: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Current Month</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Year</label>
                  <select
                    value={draft.y}
                    onChange={(e) => setDraft({ ...draft, y: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Current year</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {draft.mode === "range" && (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">From</label>
                  <input
                    type="date"
                    value={draft.from}
                    onChange={(e) => setDraft({ ...draft, from: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">To</label>
                  <input
                    type="date"
                    value={draft.to}
                    onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetCurrentMonth}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <FiRefreshCw />
                Reset to {currentMonthYearLabel}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterOpen(false)}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={applyFilter}
                  disabled={disableApply}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total Income" value={formatCurrency(incomeAmount)} tone="emerald" icon={<FiTrendingUp />} />
        <MetricCard label="Total Expense" value={formatCurrency(expenseAmount)} tone="rose" icon={<FiTrendingDown />} />
        <MetricCard label="Net Balance" value={formatCurrency(netBalance)} tone="sky" icon={<FiActivity />} />
        <MetricCard label="Gross Profit" value={formatCurrency(grossProfit)} tone="violet" icon={<FiTrendingUp />} />
        <MetricCard label="Net Profit" value={formatCurrency(netProfit)} tone="amber" icon={<FiPieChart />} />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 xl:col-span-1">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Income vs Expense Ratio</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Visual split of current filtered amounts.</p>
          <div className="mt-4">
            <ReactApexChart
              type="donut"
              height={320}
              options={ratioOptions}
              series={[incomeAmount, expenseAmount]}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 xl:col-span-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Daily Trend</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Income and expense movement by date.</p>
          <div className="mt-4">
            <ReactApexChart
              type="area"
              height={320}
              options={dailyTrendOptions}
              series={[
                { name: "Income", data: dailyTrend.map((item) => item.income) },
                { name: "Expense", data: dailyTrend.map((item) => item.expense) },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Payment Method Performance</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Method-level income and expense comparison.</p>
          <div className="mt-4">
            <ReactApexChart
              type="bar"
              height={330}
              options={methodBarOptions}
              series={[
                { name: "Income", data: methodRows.map((item) => item.income) },
                { name: "Expense", data: methodRows.map((item) => item.expense) },
              ]}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Status Distribution</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Top statuses with income/expense stack.</p>
          <div className="mt-4">
            <ReactApexChart
              type="bar"
              height={330}
              options={statusOptions}
              series={[
                { name: "Income", data: statusRows.map((item) => item.income) },
                { name: "Expense", data: statusRows.map((item) => item.expense) },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 xl:col-span-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Top Counterparties by Volume</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Most active entities in selected period.</p>
          <div className="mt-4">
            <ReactApexChart
              type="bar"
              height={340}
              options={topEntityOptions}
              series={[
                { name: "Volume", data: topEntities.map((item) => item.volume) },
              ]}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Quick Insights</h3>
          <div className="mt-4 space-y-3 text-sm">
            <InsightRow label="Income Records" value={String(accountsData?.incomeCount ?? 0)} icon={<FiTrendingUp />} tone="emerald" />
            <InsightRow label="Expense Records" value={String(accountsData?.expenseCount ?? 0)} icon={<FiTrendingDown />} tone="rose" />
            <InsightRow label="Tracked Statuses" value={String(statusRows.length)} icon={<FiActivity />} tone="sky" />
            <InsightRow label="Top Entities" value={String(topEntities.length)} icon={<FiUsers />} tone="violet" />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Method Snapshot</p>
            <div className="mt-2 space-y-2">
              {methodRows.slice(0, 4).map((row) => (
                <div key={row.key} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{row.method}</span>
                  <span
                    className={clsx(
                      "rounded-full px-2 py-0.5 font-bold",
                      row.balance >= 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
                    )}
                  >
                    {formatCurrency(row.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose" | "sky" | "violet" | "amber";
  icon: React.ReactNode;
}) {
  const toneMap: Record<string, string> = {
    emerald: "border-emerald-200/70 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300",
    rose: "border-rose-200/70 bg-rose-50/70 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300",
    sky: "border-sky-200/70 bg-sky-50/70 text-sky-700 dark:border-sky-900/30 dark:bg-sky-950/20 dark:text-sky-300",
    violet: "border-violet-200/70 bg-violet-50/70 text-violet-700 dark:border-violet-900/30 dark:bg-violet-950/20 dark:text-violet-300",
    amber: "border-amber-200/70 bg-amber-50/70 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300",
  };

  return (
    <div className={clsx("rounded-2xl border p-4", toneMap[tone])}>
      <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em]">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function InsightRow({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "emerald" | "rose" | "sky" | "violet";
}) {
  const toneMap: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
      <p className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
        <span className={clsx("inline-flex h-6 w-6 items-center justify-center rounded-lg", toneMap[tone])}>
          {icon}
        </span>
        {label}
      </p>
      <p className="text-sm font-black text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
