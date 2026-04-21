"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FiArrowRight, FiArrowLeft, FiChevronsRight, FiFilter, FiRefreshCw, FiChevronDown } from "react-icons/fi";
import { useUserContext } from "@/contexts/UserContext";
import { hasPermission } from "@/auth/permissions";

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

type TransferRecord = {
  id: string;
  method?: string;
  amount?: string;
  dateTime?: string;
  remarks?: string;
  suffix?: string;
  number?: number;
};

type TransferRow = {
  id: string;
  expense?: TransferRecord;
  income?: TransferRecord;
};

type SelfTransfersResponse = {
  count: number;
  hasMore: boolean;
  records: TransferRow[];
  totalIncome: number;
  totalExpense: number;
  totalTransactions: number;
  report?: {
    thisMonthTransfers: number;
    allTimeTransfers: number;
  };
};

export default function SelfTransfersPage() {
  const router = useRouter();
  const { user } = useUserContext();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");
  const [sort, setSort] = useState("newest");
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [draft, setDraft] = useState({ ...baseFilter });
  const [filter, setFilter] = useState({ ...baseFilter });

  const permissions = Array.isArray(user?.permissions) ? (user.permissions as string[]) : [];
  const canViewSelfTransfers = hasPermission(permissions, "payments.view.self-transfers");
  const canManageSelfTransfers = hasPermission(permissions, "payments.manage.self-transfers");

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

  const { data, isLoading, isError, refetch } = useQuery<SelfTransfersResponse>({
    queryKey: ["self-transfers-page", page, search, method, sort, dateRangeQuery],
    enabled: canViewSelfTransfers,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (search.trim()) params.set("q", search.trim());
      if (method) params.set("m", method);
      if (sort) params.set("sort", sort);
      
      // Add date range params
      const fullQuery = `/api/payment/self-deposit${dateRangeQuery ? dateRangeQuery + "&" : "?"}${params.toString()}`;
      const response = await axios.get(fullQuery);
      return response.data;
    },
  });

  const rows = useMemo(() => data?.records ?? [], [data?.records]);

  const methodOptions = useMemo(() => {
    const recordRows = rows;
    const values = new Set<string>();
    recordRows.forEach((row) => {
      if (row.expense?.method) values.add(row.expense.method);
      if (row.income?.method) values.add(row.income.method);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const thisMonth = data?.report?.thisMonthTransfers || 0;
  const allTime = data?.report?.allTimeTransfers || 0;

  useEffect(() => {
    if (user && !canViewSelfTransfers) {
      router.push("/");
    }
  }, [user, canViewSelfTransfers, router]);

  if (!user || !canViewSelfTransfers) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Self Transfers" />

      <section className="rounded-3xl border border-cyan-300/50 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6 dark:border-cyan-700/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300 bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/20 dark:text-cyan-300">
              <FiChevronsRight /> Transfer Flow
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Self Transfers</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Track internal movement from one payment method to another.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterOpen(true)}
              className="inline-flex min-w-[200px] items-center justify-between gap-3 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700"
            >
              <span className="inline-flex items-center gap-2">
                <FiFilter />
                {filterDisplay}
              </span>
              <FiChevronDown />
            </button>
            {canManageSelfTransfers && (
              <Link
                href="/accounts/add-record?recordKind=self_transfer"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-white px-4 py-2 text-sm font-bold text-cyan-700 hover:bg-cyan-50 dark:border-cyan-700 dark:bg-slate-900 dark:text-cyan-300"
              >
                Create Self Transfer
              </Link>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-cyan-300/60 bg-white/90 p-4 dark:border-cyan-700/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">This Month</p>
            <p className="mt-1 text-2xl font-black text-cyan-700 dark:text-cyan-300">{thisMonth}</p>
          </div>
          <div className="rounded-2xl border border-slate-300/70 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">All Time</p>
            <p className="mt-1 text-2xl font-black text-slate-800 dark:text-slate-100">{allTime}</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/60 bg-white/90 p-4 dark:border-emerald-700/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Total In</p>
            <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">AED {(data?.totalIncome || 0).toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-rose-300/60 bg-white/90 p-4 dark:border-rose-700/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">Total Out</p>
            <p className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-300">AED {(data?.totalExpense || 0).toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              <FiFilter /> Search
            </label>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Search method, remarks, number"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 inline-flex text-xs font-bold uppercase tracking-wider text-slate-500">Method</label>
            <select
              value={method}
              onChange={(event) => {
                setMethod(event.target.value);
                setPage(0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All Methods</option>
              {methodOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 inline-flex text-xs font-bold uppercase tracking-wider text-slate-500">Sort</label>
            <div className="flex gap-2">
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(0);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="amount-desc">Amount (High-Low)</option>
                <option value="amount-asc">Amount (Low-High)</option>
              </select>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 dark:border-slate-700"
              >
                <FiRefreshCw />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading self transfers...</p>
        ) : isError ? (
          <p className="text-sm text-rose-600 dark:text-rose-300">Failed to load self transfers.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No self transfers found for current filters.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const fromMethod = row.expense?.method || "Unknown";
              const toMethod = row.income?.method || "Unknown";
              const amount = Number(row.expense?.amount || row.income?.amount || 0);
              const when = row.expense?.dateTime || row.income?.dateTime || "-";
              const detailsId = row.expense?.id || row.income?.id || "";

              return (
                <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                      <span className="rounded-lg bg-rose-100 px-2 py-1 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{fromMethod}</span>
                      <FiArrowRight className="text-slate-500" />
                      <span className="rounded-lg bg-emerald-100 px-2 py-1 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{toMethod}</span>
                    </div>
                    {detailsId ? (
                      <Link
                        href={`/accounts/transactions/details/${detailsId}`}
                        className="text-xs font-bold text-cyan-700 hover:underline dark:text-cyan-300"
                      >
                        Open Details
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold">AED {amount.toFixed(2)}</span>
                    <span>{when}</span>
                    {row.expense?.suffix || row.expense?.number ? (
                      <span>
                        {row.expense?.suffix || ""}
                        {row.expense?.number || ""}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={page <= 0}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-slate-700"
              >
                <FiArrowLeft /> Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!data?.hasMore}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-slate-700"
              >
                Next <FiArrowRight />
              </button>
            </div>
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
                    ? "bg-cyan-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {currentMonthYearLabel}
              </button>
              <button
                onClick={() => setDraft({ ...draft, mode: "year", m: "", from: "", to: "" })}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  draft.mode === "year"
                    ? "bg-cyan-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                Year
              </button>
              <button
                onClick={() => setDraft({ ...draft, mode: "month", from: "", to: "" })}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  draft.mode === "month"
                    ? "bg-cyan-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                Month / Year
              </button>
              <button
                onClick={() => setDraft({ ...draft, mode: "range", m: "", y: "" })}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  draft.mode === "range"
                    ? "bg-cyan-600 text-white"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">To</label>
                  <input
                    type="date"
                    value={draft.to}
                    onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                      ? "cursor-not-allowed bg-cyan-400 opacity-50"
                      : "bg-cyan-600 hover:bg-cyan-700"
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

