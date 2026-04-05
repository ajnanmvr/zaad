"use client";

import Link from "next/link";
import axios from "axios";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiCalendar,
  FiCreditCard,
  FiFilter,
  FiSearch,
  FiSliders,
  FiTrendingDown,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

type BalanceRow = {
  id?: string;
  name: string;
  balance: number;
  serviceFee?: number;
  lastActivityAt?: string | Date | null;
};

type ProfitResponse = {
  over0balanceCompanies: BalanceRow[];
  under0balanceCompanies: BalanceRow[];
  totalProfitAllCompanies: number;
  totalToGiveCompanies: number;
  totalToGetCompanies: number;
  over0balanceEmployees: BalanceRow[];
  under0balanceEmployees: BalanceRow[];
  totalProfitAllEmployees: number;
  totalToGiveEmployees: number;
  totalToGetEmployees: number;
  over0balanceIndividuals: BalanceRow[];
  under0balanceIndividuals: BalanceRow[];
  totalProfitAllIndividuals: number;
  totalToGiveIndividuals: number;
  totalToGetIndividuals: number;
  profit: number;
  totalToGive: number;
  totalToGet: number;
};

type UnifiedRow = BalanceRow & {
  entityType: "company" | "employee" | "individual";
  category: "credit" | "debit";
};

const entityTypeLabels: Record<UnifiedRow["entityType"], string> = {
  company: "Company",
  employee: "Employee",
  individual: "Individual",
};

const baseFilter = {
  entityType: "all" as "all" | UnifiedRow["entityType"],
  category: "all" as "all" | UnifiedRow["category"],
  amountMode: "all" as "all" | "above" | "below",
  amount: "",
  search: "",
  sort: "time-desc" as "time-desc" | "time-asc" | "name-asc" | "name-desc" | "amount-desc" | "amount-asc",
};

function amountLabel(value: number) {
  return `${Math.abs(value).toFixed(2)} AED`;
}

function toDateValue(value?: string | Date | null) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function UnifiedTable({
  rows,
  searchValue,
  onSearchChange,
  showFilters,
  onToggleFilters,
  showSort,
  onToggleSort,
}: {
  rows: UnifiedRow[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  showSort: boolean;
  onToggleSort: () => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">Credit And Debit List</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Filter by entity type, credit/debit direction, amount, search, alphabetical order, or time.
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {rows.length} Results
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Search and Filter Bar in Table Header */}
        <div className="flex items-end gap-3 border-b border-slate-200 bg-slate-50/50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/30">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search by name, id, type..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* Filter Button */}
          <button
            type="button"
            onClick={onToggleFilters}
            className={`flex h-10 items-center justify-center rounded-xl border px-3 py-2 transition ${
              showFilters
                ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
            title="Toggle filters"
          >
            <FiFilter className="text-lg" />
          </button>

          {/* Sort Button */}
          <button
            type="button"
            onClick={onToggleSort}
            className={`flex h-10 items-center justify-center rounded-xl border px-3 py-2 transition ${
              showSort
                ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
            title="Toggle sort"
          >
            <FiSliders className="text-lg" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-900/95">
              <tr className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">Entity</th>
                <th className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">Type</th>
                <th className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">Direction</th>
                <th className="border-b border-slate-200 px-5 py-4 text-right dark:border-slate-800">Balance</th>
                <th className="border-b border-slate-200 px-5 py-4 text-right dark:border-slate-800">Service Fee</th>
                <th className="border-b border-slate-200 px-5 py-4 text-right dark:border-slate-800">Last Activity</th>
                <th className="border-b border-slate-200 px-5 py-4 text-right dark:border-slate-800">Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isCredit = row.category === "credit";
                return (
                  <tr key={`${row.entityType}-${row.category}-${row.id}`} className="border-b border-slate-100 bg-white transition-colors last:border-0 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60">
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className={isCredit ? "h-3 w-3 rounded-full bg-emerald-500" : "h-3 w-3 rounded-full bg-rose-500"} />
                        <div>
                          <h5 className="font-semibold text-slate-800 transition-colors dark:text-slate-200">
                            {row.id ? (
                              <Link href={`/${row.entityType}/${row.id}`} className={isCredit ? "hover:text-emerald-700 dark:hover:text-emerald-400" : "hover:text-rose-700 dark:hover:text-rose-400"}>
                                {row.name}
                              </Link>
                            ) : (
                              row.name
                            )}
                          </h5>
                          <p className="text-xs text-slate-500 dark:text-slate-500">{row.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {entityTypeLabels[row.entityType]}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <span className={isCredit ? "inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"}>
                        {isCredit ? <FiArrowUpRight /> : <FiArrowDownLeft />}
                        {isCredit ? "Credit" : "Debit"}
                      </span>
                    </td>
                    <td className={isCredit ? "px-5 py-4 text-right font-black text-emerald-600 dark:text-emerald-400" : "px-5 py-4 text-right font-black text-rose-600 dark:text-rose-400"}>
                      {amountLabel(row.balance)}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {amountLabel(row.serviceFee || 0)}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-slate-600 dark:text-slate-400">
                      {row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-5 py-4 text-right align-middle">
                      {row.id ? (
                        <Link
                          href={`/${row.entityType}/${row.id}`}
                          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-cyan-900/50 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-300"
                        >
                          Open Profile
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default function CreditDebitPage() {
  const [filter, setFilter] = useState({ ...baseFilter });
  const [draft, setDraft] = useState({ ...baseFilter });
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const { data, isLoading } = useQuery<ProfitResponse>({
    queryKey: ["credit-debit-list"],
    queryFn: async () => {
      const response = await axios.get("/api/payment/profits");
      return response.data;
    },
  });

  const rows = useMemo<UnifiedRow[]>(() => {
    const toRows = (
      source: BalanceRow[] | undefined,
      entityType: UnifiedRow["entityType"],
      category: UnifiedRow["category"],
    ) => (source || []).map((item) => ({ ...item, entityType, category }));

    return [
      ...toRows(data?.over0balanceCompanies, "company", "credit"),
      ...toRows(data?.over0balanceEmployees, "employee", "credit"),
      ...toRows(data?.over0balanceIndividuals, "individual", "credit"),
      ...toRows(data?.under0balanceCompanies, "company", "debit"),
      ...toRows(data?.under0balanceEmployees, "employee", "debit"),
      ...toRows(data?.under0balanceIndividuals, "individual", "debit"),
    ];
  }, [data]);

  const filteredRows = useMemo(() => {
    const searchValue = filter.search.trim().toLowerCase();
    const numericAmount = filter.amount.trim() ? Number(filter.amount) : undefined;

    const filtered = rows.filter((row) => {
      if (filter.entityType !== "all" && row.entityType !== filter.entityType) return false;
      if (filter.category !== "all" && row.category !== filter.category) return false;

      if (numericAmount !== undefined && !Number.isNaN(numericAmount)) {
        if (filter.amountMode === "above" && Math.abs(row.balance) <= numericAmount) return false;
        if (filter.amountMode === "below" && Math.abs(row.balance) >= numericAmount) return false;
      }

      if (searchValue) {
        const haystack = [row.name, row.id, entityTypeLabels[row.entityType], row.category, row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleDateString() : ""]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(searchValue)) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      switch (filter.sort) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "amount-asc":
          return Math.abs(a.balance) - Math.abs(b.balance);
        case "amount-desc":
          return Math.abs(b.balance) - Math.abs(a.balance);
        case "time-asc":
          return toDateValue(a.lastActivityAt) - toDateValue(b.lastActivityAt);
        case "time-desc":
        default:
          return toDateValue(b.lastActivityAt) - toDateValue(a.lastActivityAt);
      }
    });

    return filtered;
  }, [filter, rows]);

  const summary = useMemo(() => {
    const creditRows = rows.filter((row) => row.category === "credit");
    const debitRows = rows.filter((row) => row.category === "debit");

    const totalCredit = creditRows.reduce((sum, row) => sum + Math.abs(row.balance), 0);
    const totalDebit = debitRows.reduce((sum, row) => sum + Math.abs(row.balance), 0);

    const companyCredit = creditRows
      .filter((row) => row.entityType === "company")
      .reduce((sum, row) => sum + Math.abs(row.balance), 0);
    const companyDebit = debitRows
      .filter((row) => row.entityType === "company")
      .reduce((sum, row) => sum + Math.abs(row.balance), 0);

    const employeeCredit = creditRows
      .filter((row) => row.entityType === "employee")
      .reduce((sum, row) => sum + Math.abs(row.balance), 0);
    const employeeDebit = debitRows
      .filter((row) => row.entityType === "employee")
      .reduce((sum, row) => sum + Math.abs(row.balance), 0);

    const individualCredit = creditRows
      .filter((row) => row.entityType === "individual")
      .reduce((sum, row) => sum + Math.abs(row.balance), 0);
    const individualDebit = debitRows
      .filter((row) => row.entityType === "individual")
      .reduce((sum, row) => sum + Math.abs(row.balance), 0);

    return {
      creditCount: creditRows.length,
      debitCount: debitRows.length,
      companyCount: rows.filter((row) => row.entityType === "company").length,
      employeeCount: rows.filter((row) => row.entityType === "employee").length,
      individualCount: rows.filter((row) => row.entityType === "individual").length,
      totalCredit,
      totalDebit,
      companyCredit,
      companyDebit,
      employeeCredit,
      employeeDebit,
      individualCredit,
      individualDebit,
    };
  }, [rows]);

  const applyFilter = () => setFilter({ ...draft });
  const resetFilter = () => {
    setDraft({ ...baseFilter });
    setFilter({ ...baseFilter });
  };

  const canApply = Boolean(draft.search.trim() || draft.entityType !== "all" || draft.category !== "all" || draft.amount.trim() || draft.sort !== "time-desc");

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Credit / Debit" />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Credit And Debit List</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          One unified list with filters for type, direction, amount, search, alphabetical order, and time.
        </p>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Total Credit and Debit */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Total Credit */}
              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 dark:border-emerald-900/30 dark:bg-gradient-to-br dark:from-emerald-900/20 dark:to-emerald-900/10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Total Credit</p>
                    <p className="mt-2 text-3xl font-black text-emerald-700 dark:text-emerald-300">
                      {amountLabel(summary.totalCredit)}
                    </p>
                  </div>
                  <FiTrendingUp className="text-3xl text-emerald-600 dark:text-emerald-400" />
                </div>

                {/* Credit Breakdown */}
                <div className="mt-4 space-y-2 border-t border-emerald-200 pt-4 dark:border-emerald-900/30">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-600 dark:text-emerald-400">Company</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">{amountLabel(summary.companyCredit)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-600 dark:text-emerald-400">Employee</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">{amountLabel(summary.employeeCredit)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-600 dark:text-emerald-400">Individual</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">{amountLabel(summary.individualCredit)}</span>
                  </div>
                </div>
              </div>

              {/* Total Debit */}
              <div className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/50 p-6 dark:border-rose-900/30 dark:bg-gradient-to-br dark:from-rose-900/20 dark:to-rose-900/10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">Total Debit</p>
                    <p className="mt-2 text-3xl font-black text-rose-700 dark:text-rose-300">
                      {amountLabel(summary.totalDebit)}
                    </p>
                  </div>
                  <FiTrendingDown className="text-3xl text-rose-600 dark:text-rose-400" />
                </div>

                {/* Debit Breakdown */}
                <div className="mt-4 space-y-2 border-t border-rose-200 pt-4 dark:border-rose-900/30">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-rose-600 dark:text-rose-400">Company</span>
                    <span className="font-semibold text-rose-700 dark:text-rose-300">{amountLabel(summary.companyDebit)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-rose-600 dark:text-rose-400">Employee</span>
                    <span className="font-semibold text-rose-700 dark:text-rose-300">{amountLabel(summary.employeeDebit)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-rose-600 dark:text-rose-400">Individual</span>
                    <span className="font-semibold text-rose-700 dark:text-rose-300">{amountLabel(summary.individualDebit)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Count Stats */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Credits Count</p>
                <p className="mt-1 inline-flex items-center gap-2 text-xl font-black text-emerald-700 dark:text-emerald-300">
                  <FiTrendingUp />
                  {summary.creditCount}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/30 dark:bg-rose-900/10">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Debits Count</p>
                <p className="mt-1 inline-flex items-center gap-2 text-xl font-black text-rose-700 dark:text-rose-300">
                  <FiTrendingDown />
                  {summary.debitCount}
                </p>
              </div>
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900/30 dark:bg-cyan-900/10">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Companies</p>
                <p className="mt-1 inline-flex items-center gap-2 text-xl font-black text-cyan-700 dark:text-cyan-300">
                  <FiUsers />
                  {summary.companyCount}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Rows</p>
                <p className="mt-1 inline-flex items-center gap-2 text-xl font-black text-slate-900 dark:text-slate-100">
                  <FiCreditCard />
                  {rows.length}
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      {!isLoading && (
        <>
          {/* Filters Panel */}
          {showFilters && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Advanced Filters</h3>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <FiX />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Entity Type</span>
                  <select
                    value={draft.entityType}
                    onChange={(event) => setDraft((prev) => ({ ...prev, entityType: event.target.value as typeof prev.entityType }))}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
                  >
                    <option value="all">All Types</option>
                    <option value="company">Company</option>
                    <option value="employee">Employee</option>
                    <option value="individual">Individual</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Direction</span>
                  <select
                    value={draft.category}
                    onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value as typeof prev.category }))}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
                  >
                    <option value="all">All Directions</option>
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                  </select>
                </label>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount Range</span>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={draft.amountMode}
                      onChange={(event) => setDraft((prev) => ({ ...prev, amountMode: event.target.value as typeof prev.amountMode }))}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
                    >
                      <option value="all">Any Amount</option>
                      <option value="above">Above</option>
                      <option value="below">Below</option>
                    </select>
                    <input
                      type="number"
                      value={draft.amount}
                      onChange={(event) => setDraft((prev) => ({ ...prev, amount: event.target.value }))}
                      placeholder="Amount"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={resetFilter}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={applyFilter}
                  disabled={!canApply}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply Filters
                </button>
              </div>
            </section>
          )}

          {/* Sort Panel */}
          {showSort && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Sort Options</h3>
                <button
                  type="button"
                  onClick={() => setShowSort(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <FiX />
                </button>
              </div>

              <div className="space-y-2">
                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sort By</span>
                  <select
                    value={draft.sort}
                    onChange={(event) => {
                      setDraft((prev) => ({ ...prev, sort: event.target.value as typeof prev.sort }));
                      setFilter((prev) => ({ ...prev, sort: event.target.value as typeof prev.sort }));
                      setShowSort(false);
                    }}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
                  >
                    <option value="time-desc">Newest First</option>
                    <option value="time-asc">Oldest First</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="amount-desc">Amount High-Low</option>
                    <option value="amount-asc">Amount Low-High</option>
                  </select>
                </label>
              </div>
            </section>
          )}

          {/* Table with integrated search/filter */}
          <UnifiedTable
            rows={filteredRows}
            searchValue={draft.search}
            onSearchChange={(value) => setDraft((prev) => ({ ...prev, search: value }))}
            showFilters={showFilters}
            onToggleFilters={() => {
              setShowFilters(!showFilters);
              setShowSort(false);
            }}
            showSort={showSort}
            onToggleSort={() => {
              setShowSort(!showSort);
              setShowFilters(false);
            }}
          />
        </>
      )}
    </div>
  );
}
