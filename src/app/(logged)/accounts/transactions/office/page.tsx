"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FiFilter, FiPlusCircle, FiRefreshCw, FiChevronDown } from "react-icons/fi";

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
    if (filter.m && filter.y) return `?month=${filter.m}&y=${filter.y}`;
    if (filter.m) return `?month=${filter.m}`;
    if (filter.y) return `?y=${filter.y}`;
  }

  return "";
};

const baseFilter = {
  mode: "current" as "current" | "year" | "month" | "range",
  m: "",
  y: "",
  from: "",
  to: "",
};

type OfficeSummaryRow = {
  category: string;
  total: number;
  count: number;
};

type OfficeResponse = {
  summary: {
    incomeByCategory: OfficeSummaryRow[];
    expenseByCategory: OfficeSummaryRow[];
    totalIncome: number;
    totalExpense: number;
  };
};

type CategoryMatrixRow = {
  category: string;
  income: number;
  expense: number;
  incomeCount: number;
  expenseCount: number;
};

export default function OfficeRecordsPage() {
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [draft, setDraft] = useState({ ...baseFilter });
  const [filter, setFilter] = useState({ ...baseFilter });

  const dateRangeQuery = useMemo(() => queryFromFilter(filter), [filter]);

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

  const { data, isLoading, isError } = useQuery<OfficeResponse>({
    queryKey: ["office-records-page-summary", dateRangeQuery],
    queryFn: async () => {
      const fullQuery = `/api/payment/office-records${dateRangeQuery}`;
      const { data } = await axios.get(fullQuery);
      return data;
    },
  });

  const totalIncome = data?.summary?.totalIncome ?? 0;
  const totalExpense = data?.summary?.totalExpense ?? 0;
  const net = useMemo(() => Number((totalIncome - totalExpense).toFixed(2)), [totalIncome, totalExpense]);

  const rows = useMemo(() => {
    const matrix = new Map<string, CategoryMatrixRow>();

    const income = data?.summary?.incomeByCategory ?? [];
    const expense = data?.summary?.expenseByCategory ?? [];

    for (const row of income) {
      matrix.set(row.category, {
        category: row.category,
        income: row.total,
        expense: matrix.get(row.category)?.expense || 0,
        incomeCount: row.count,
        expenseCount: matrix.get(row.category)?.expenseCount || 0,
      });
    }

    for (const row of expense) {
      matrix.set(row.category, {
        category: row.category,
        income: matrix.get(row.category)?.income || 0,
        expense: row.total,
        incomeCount: matrix.get(row.category)?.incomeCount || 0,
        expenseCount: row.count,
      });
    }

    return Array.from(matrix.values()).sort((a, b) => a.category.localeCompare(b.category));
  }, [data?.summary?.incomeByCategory, data?.summary?.expenseByCategory]);

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Office Records" />

      <section className="rounded-3xl border border-amber-300/60 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-6 dark:border-amber-700/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-800 dark:border-amber-600/40 dark:bg-amber-500/10 dark:text-amber-300">
              <FiFilter /> Office Summary
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Office Records</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Office income/expense report with filters and category matrix.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterOpen(true)}
              className="inline-flex min-w-[200px] items-center justify-between gap-3 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700"
            >
              <span className="inline-flex items-center gap-2">
                <FiFilter />
                {filterDisplay}
              </span>
              <FiChevronDown />
            </button>
            <Link
              href="/accounts/add-record?recordKind=office_records&type=income"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300"
            >
              <FiPlusCircle /> Income
            </Link>
            <Link
              href="/accounts/add-record?recordKind=office_records&type=expense"
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:bg-slate-900 dark:text-rose-300"
            >
              <FiPlusCircle /> Expense
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-300/60 bg-white/80 p-4 dark:border-emerald-700/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Total Income</p>
            <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">AED {totalIncome.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-rose-300/60 bg-white/80 p-4 dark:border-rose-700/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">Total Expense</p>
            <p className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-300">AED {totalExpense.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-slate-300/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Net</p>
            <p className={clsx("mt-1 text-2xl font-black", net >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>AED {net.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <h2 className="mb-4 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">Office Categories</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No categories found for selected filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Income</th>
                  <th className="px-3 py-2">Expense</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.category} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-3 text-sm font-bold text-slate-800 dark:text-slate-100">{row.category}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">AED {row.income.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">AED {row.expense.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isFilterOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-8">
            <h3 className="mb-6 text-xl font-black text-slate-900 dark:text-white">Date Range Filter</h3>

            <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-4">
              <button
                onClick={() => setDraft({ ...draft, mode: "current", m: "", y: "", from: "", to: "" })}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  draft.mode === "current"
                    ? "bg-amber-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {currentMonthYearLabel}
              </button>
              <button
                onClick={() => setDraft({ ...draft, mode: "year", m: "", from: "", to: "" })}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  draft.mode === "year"
                    ? "bg-amber-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                Year
              </button>
              <button
                onClick={() => setDraft({ ...draft, mode: "month", from: "", to: "" })}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  draft.mode === "month"
                    ? "bg-amber-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                Month / Year
              </button>
              <button
                onClick={() => setDraft({ ...draft, mode: "range", m: "", y: "" })}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  draft.mode === "range"
                    ? "bg-amber-600 text-white"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">To</label>
                  <input
                    type="date"
                    value={draft.to}
                    onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                  className={clsx(
                    "rounded-xl px-5 py-2 text-sm font-semibold text-white transition",
                    disableApply
                      ? "cursor-not-allowed bg-amber-400 opacity-50"
                      : "bg-amber-600 hover:bg-amber-700"
                  )}
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

