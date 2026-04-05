"use client";

import React, { useMemo, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { TAccountsData } from "@/types/dashboard";
import {
  FiCalendar,
  FiChevronDown,
  FiFilter,
  FiRefreshCw,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";

const baseFilter = {
  mode: "current" as "current" | "year" | "month" | "range",
  m: "",
  y: "",
  from: "",
  to: "",
};

const formatCurrency = (value: number) => `${value.toFixed(2)} AED`;

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
  (_, index) => String(startYear + index)
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

export default function AccountsDashboard() {
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [draft, setDraft] = useState({ ...baseFilter });
  const [filter, setFilter] = useState({ ...baseFilter });

  const query = useMemo(() => queryFromFilter(filter), [filter]);

  const { data: accountsData, isLoading } = useQuery<TAccountsData>({
    queryKey: ["accounts-simple", query],
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

  const methodRows = useMemo(() => {
    const providedBreakdown = accountsData?.methodBreakdown || [];
    if (providedBreakdown.length > 0) {
      return providedBreakdown.map((row) => ({
        key: row.method,
        method: toTitleCase(row.method),
        income: row.income,
        expense: row.expense,
        balance: row.balance,
      }));
    }

    const incomeSummary = accountsData?.summary?.income || {};
    const expenseSummary = accountsData?.summary?.expense || {};

    const summaryMethods = new Set([
      ...Object.keys(incomeSummary),
      ...Object.keys(expenseSummary),
    ]);

    if (summaryMethods.size === 0) return [];

    const preferredOrder = ["cash", "bank", "tasdeed", "swiper"];
    const orderedMethods = Array.from(summaryMethods).sort((a, b) => {
      const ia = preferredOrder.indexOf(a);
      const ib = preferredOrder.indexOf(b);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return a.localeCompare(b);
    });

    return orderedMethods.map((method) => {
      const income = incomeSummary[method] || 0;
      const expense = expenseSummary[method] || 0;
      return {
        key: method,
        method: toTitleCase(method),
        income,
        expense,
        balance: income - expense,
      };
    });
  }, [accountsData]);

  const applyFilter = () => {
    setFilter({ ...draft });
    setFilterOpen(false);
  };

  const resetCurrentMonth = () => {
    setFilter({ ...baseFilter });
    setDraft({ ...baseFilter });
    setFilterOpen(false);
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
      <section className="relative overflow-hidden rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-5 shadow-sm dark:border-cyan-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1 text-xs font-black uppercase tracking-wider text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300">
              <FiCalendar />
              Simplified Analytics
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Accounts Monthly Summary
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600 dark:text-slate-400">
              Filter by current month, custom month/year, or custom date range. No graph calculations included.
            </p>
          </div>

          <button
            onClick={() => setFilterOpen(true)}
            className="inline-flex min-w-[240px] items-center justify-between gap-3 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
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
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Total Income</p>
          <p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(accountsData?.totalIncomeAmount ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4 dark:border-rose-900/30 dark:bg-rose-950/20">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">Total Expense</p>
          <p className="mt-2 text-2xl font-black text-rose-700 dark:text-rose-300">{formatCurrency(accountsData?.totalExpenseAmount ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-cyan-200/70 bg-cyan-50/70 p-4 dark:border-cyan-900/30 dark:bg-cyan-950/20">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Net Balance</p>
          <p className="mt-2 text-2xl font-black text-cyan-700 dark:text-cyan-300">{formatCurrency(accountsData?.totalBalance ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-violet-200/70 bg-violet-50/70 p-4 dark:border-violet-900/30 dark:bg-violet-950/20">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">Profit</p>
          <p className="mt-2 inline-flex items-center gap-2 text-2xl font-black text-violet-700 dark:text-violet-300">
            {(accountsData?.grossProfit ?? accountsData?.profit ?? 0) >= 0 ? <FiTrendingUp className="text-emerald-500" /> : <FiTrendingDown className="text-rose-500" />}
            {formatCurrency(accountsData?.grossProfit ?? accountsData?.profit ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Profit After Office Expenses</p>
          <p className="mt-2 inline-flex items-center gap-2 text-2xl font-black text-amber-700 dark:text-amber-300">
            {(accountsData?.profitAfterOfficeExpenses ?? accountsData?.netProfit ?? 0) >= 0 ? <FiTrendingUp className="text-emerald-500" /> : <FiTrendingDown className="text-rose-500" />}
            {formatCurrency(accountsData?.profitAfterOfficeExpenses ?? accountsData?.netProfit ?? 0)}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Income Records</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{accountsData?.incomeCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Expense Records</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{accountsData?.expenseCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Service Fee Profit</p>
          <p className="mt-2 inline-flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {(accountsData?.grossProfit ?? accountsData?.profit ?? 0) >= 0 ? <FiTrendingUp className="text-emerald-500" /> : <FiTrendingDown className="text-rose-500" />}
            {formatCurrency(accountsData?.grossProfit ?? accountsData?.profit ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Net Profit After Office Expenses</p>
          <p className="mt-2 inline-flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {(accountsData?.profitAfterOfficeExpenses ?? accountsData?.netProfit ?? 0) >= 0 ? <FiTrendingUp className="text-emerald-500" /> : <FiTrendingDown className="text-rose-500" />}
            {formatCurrency(accountsData?.profitAfterOfficeExpenses ?? accountsData?.netProfit ?? 0)}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-6">
        <h2 className="mb-4 text-lg font-black text-slate-900 dark:text-slate-100">Method Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="px-2 py-3">Method</th>
                <th className="px-2 py-3">Income</th>
                <th className="px-2 py-3">Expense</th>
                <th className="px-2 py-3">Balance</th>
              </tr>
            </thead>
            <tbody>
              {methodRows.map((row) => (
                <tr key={row.key} className="border-b border-slate-100 text-sm dark:border-slate-800">
                  <td className="px-2 py-3 font-bold text-slate-900 dark:text-slate-100">{row.method}</td>
                  <td className="px-2 py-3 text-emerald-600 dark:text-emerald-400">{formatCurrency(row.income)}</td>
                  <td className="px-2 py-3 text-rose-600 dark:text-rose-400">{formatCurrency(row.expense)}</td>
                  <td className="px-2 py-3 font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
