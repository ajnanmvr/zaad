"use client";

import { useMemo, useState } from "react";
import { useUserContext } from "@/contexts/UserContext";
import { hasPermission } from "@/auth/permissions";
import Link from "next/link";
import axios from "axios";
import clsx from "clsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AdminRefreshButton from "@/components/common/AdminRefreshButton";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import EntityAvatar from "@/components/common/EntityAvatar";
import ExportActionsMenu from "@/components/common/ExportActionsMenu";
import { exportRowsCsv, exportRowsExcel, exportRowsPdf } from "@/utils/exportTableData";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCreditCard,
  FiSearch,
  FiTrendingUp,
} from "react-icons/fi";

type ViewMode = "credit" | "debit";
type SortOption = "balance" | "last-payment-asc" | "last-payment-desc";

type EntityRecordStatRow = {
  entity: string;
  entityType: "company" | "employee" | "individual" | string;
  entityName: string;
  entityColor?: string;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalServiceFee: number;
  totalTransactions: number;
  lastTransactionAt?: string | null;
  badDebt?: boolean;
};

type EntityRecordStatsResponse = {
  summary: {
    creditRows: EntityRecordStatRow[];
    debitRows: EntityRecordStatRow[];
  };
};

const formatAmount = (value: number) => `AED ${Math.abs(Number(value || 0)).toFixed(2)}`;

const toEntityRouteType = (entityType: string) => {
  if (entityType === "employee" || entityType === "individual" || entityType === "company") return entityType;
  return "company";
};

const toEntityTypeLabel = (entityType: string) => {
  if (entityType === "employee") return "Employee";
  if (entityType === "individual") return "Individual";
  if (entityType === "company") return "Company";
  return "Unknown";
};

function relativeDate(dateString: string | null | undefined): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export default function CreditDebitEntityStatsList({ mode }: { mode: ViewMode }) {
  const [search, setSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<"all" | "company" | "employee" | "individual">("all");
  const [sortBy, setSortBy] = useState<SortOption>("last-payment-desc");
  const [togglingBadDebt, setTogglingBadDebt] = useState<string | null>(null);

  const isCredit = mode === "credit";

  const { data, isLoading, isError } = useQuery<EntityRecordStatsResponse>({
    queryKey: ["entity-record-stats", mode],
    queryFn: async () => {
      const { data } = await axios.get("/api/payment/entity-record-stats");
      return data;
    },
  });

  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const permissions = user?.permissions && Array.isArray(user.permissions) ? (user.permissions as string[]) : [];
  const canAdminRefresh = user
    ? hasPermission(permissions, "payments.manage.recompute-monthly-stats") ||
      hasPermission(permissions, "payments.admin") ||
      hasPermission(permissions, "admin.access")
    : false;
  const canWrite = user ? hasPermission(permissions, "payments.write") : false;

  const baseRows = useMemo(() => {
    const rows = isCredit ? data?.summary?.creditRows || [] : data?.summary?.debitRows || [];
    return rows.filter((row) => Number(row.balance || 0) !== 0);
  }, [data?.summary?.creditRows, data?.summary?.debitRows, isCredit]);

  const filteredRows = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    const filtered = baseRows.filter((row) => {
      if (entityTypeFilter !== "all" && row.entityType !== entityTypeFilter) return false;
      if (!searchText) return true;
      return (
        String(row.entityName || "").toLowerCase().includes(searchText) ||
        String(row.entity || "").toLowerCase().includes(searchText)
      );
    });

    if (sortBy === "last-payment-desc") {
      filtered.sort((a, b) => {
        const ta = a.lastTransactionAt ? new Date(a.lastTransactionAt).getTime() : 0;
        const tb = b.lastTransactionAt ? new Date(b.lastTransactionAt).getTime() : 0;
        return tb - ta;
      });
    } else if (sortBy === "last-payment-asc") {
      filtered.sort((a, b) => {
        const ta = a.lastTransactionAt ? new Date(a.lastTransactionAt).getTime() : 0;
        const tb = b.lastTransactionAt ? new Date(b.lastTransactionAt).getTime() : 0;
        return ta - tb;
      });
    }

    return filtered;
  }, [baseRows, entityTypeFilter, search, sortBy]);

  const badDebtRows = useMemo(() => filteredRows.filter((r) => r.badDebt), [filteredRows]);

  const totalBalance = useMemo(
    () => filteredRows.reduce((sum, row) => sum + Math.abs(Number(row.balance || 0)), 0),
    [filteredRows],
  );

  const exportRows = useMemo(
    () =>
      filteredRows.map((row) => ({
        Client: row.entityName,
        Type: toEntityTypeLabel(row.entityType),
        Credit: Number(row.totalIncome || 0).toFixed(2),
        Debit: (Number(row.totalExpense || 0) + Number(row.totalServiceFee || 0)).toFixed(2),
        "Service Fee": Number(row.totalServiceFee || 0).toFixed(2),
        Balance: Math.abs(Number(row.balance || 0)).toFixed(2),
        Transactions: Number(row.totalTransactions || 0),
        "Last Payment": relativeDate(row.lastTransactionAt),
        "Bad Debt": row.badDebt ? "Yes" : "No",
      })),
    [filteredRows],
  );

  const onExport = async (format: "csv" | "excel" | "pdf", _modeType: "selected" | "all") => {
    const rows = exportRows;
    if (!rows.length) return;
    const filePrefix = isCredit ? "credit-entities" : "debit-entities";
    if (format === "csv") { exportRowsCsv(rows, filePrefix); return; }
    if (format === "excel") { exportRowsExcel(rows, filePrefix); return; }
    await exportRowsPdf(rows, filePrefix);
  };

  const handleToggleBadDebt = async (row: EntityRecordStatRow) => {
    if (!canWrite) { toast.error("You don't have permission to do this"); return; }
    const newValue = !row.badDebt;
    setTogglingBadDebt(row.entity);
    try {
      await axios.patch("/api/payment/entity-record-stats", { entityId: row.entity, badDebt: newValue });
      toast.success(newValue ? "Marked as bad debt" : "Removed bad debt flag");
      queryClient.invalidateQueries({ queryKey: ["entity-record-stats"] });
    } catch {
      toast.error("Failed to update bad debt status");
    } finally {
      setTogglingBadDebt(null);
    }
  };

  const headingTitle = isCredit ? "Credit List" : "Debit List";

  return (
    <div className="space-y-6">
      <Breadcrumb pageName={isCredit ? "Credit Entities" : "Debit Entities"} />

      <section className="rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 shadow-sm dark:border-cyan-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300 bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-cyan-800 dark:border-cyan-700/40 dark:bg-cyan-500/10 dark:text-cyan-300">
              <FiCreditCard /> Entity Record Stats
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">{headingTitle}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Clients with {isCredit ? "positive" : "negative"} balance. Zero balance is hidden.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/accounts/transactions/analytics"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-700 dark:bg-slate-900 dark:text-cyan-300"
            >
              <FiTrendingUp /> Finance Summary
            </Link>
            {canAdminRefresh && (
              <AdminRefreshButton
                invalidateKeys={[["entity-record-stats", mode]]}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800"
              />
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Total Clients</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{filteredRows.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Total</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{formatAmount(totalBalance)}</p>
          </div>
          <div className="rounded-2xl border border-rose-200/70 bg-white/80 p-4 dark:border-rose-800/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-600 dark:text-rose-400">Bad Debt</p>
            <p className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-300">{badDebtRows.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Bad Debt Total</p>
            <p className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-300">
              {formatAmount(badDebtRows.reduce((s, r) => s + Math.abs(Number(r.balance || 0)), 0))}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by client name"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          <select
            value={entityTypeFilter}
            onChange={(event) => setEntityTypeFilter(event.target.value as "all" | "company" | "employee" | "individual")}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="all">All Types</option>
            <option value="company">Company</option>
            <option value="employee">Employee</option>
            <option value="individual">Individual</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="balance">Sort: Balance</option>
            <option value="last-payment-desc">Last Payment: Newest</option>
            <option value="last-payment-asc">Last Payment: Oldest</option>
          </select>

          <ExportActionsMenu onExport={onExport} />
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
            Loading {isCredit ? "credit" : "debit"} list...
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-rose-300 bg-rose-50/70 px-4 py-8 text-center text-sm text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/20 dark:text-rose-300">
            Failed to load data.
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
            No rows found for current filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40">
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Last Payment</th>
                  <th className="px-4 py-3 text-center">Bad Debt</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.entity}
                    className={clsx(
                      "border-b border-slate-100 last:border-0 dark:border-slate-800",
                      row.badDebt
                        ? "bg-rose-50/50 dark:bg-rose-950/10"
                        : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <EntityAvatar name={row.entityName || "Client"} color={row.entityColor} size="sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{row.entityName}</p>
                            {row.badDebt && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                                <FiAlertTriangle className="h-2.5 w-2.5" /> Bad Debt
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{toEntityTypeLabel(row.entityType)}</p>
                        </div>
                      </div>
                    </td>
                    <td className={clsx("px-4 py-3 text-sm font-black", isCredit ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>
                      {formatAmount(row.balance)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs text-slate-600 dark:text-slate-400"
                        title={row.lastTransactionAt ? new Date(row.lastTransactionAt).toLocaleString() : ""}
                      >
                        {relativeDate(row.lastTransactionAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        disabled={togglingBadDebt === row.entity || !canWrite}
                        onClick={() => handleToggleBadDebt(row)}
                        title={row.badDebt ? "Remove bad debt flag" : "Mark as bad debt"}
                        className={clsx(
                          "inline-flex h-7 w-7 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50",
                          row.badDebt
                            ? "border-rose-300 bg-rose-100 text-rose-600 hover:bg-rose-200 dark:border-rose-700/50 dark:bg-rose-950/40 dark:text-rose-400"
                            : "border-slate-200 bg-slate-50 text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-rose-700/50 dark:hover:bg-rose-950/30",
                        )}
                      >
                        <FiAlertTriangle className="h-3.5 w-3.5" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/accounts/transactions/${toEntityRouteType(row.entityType)}/${encodeURIComponent(row.entity)}`}
                        className={clsx(
                          "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition",
                          isCredit
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                            : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-300",
                        )}
                      >
                        View <FiArrowRight />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filteredRows.length} {isCredit ? "credit" : "debit"} {filteredRows.length === 1 ? "entry" : "entries"}
            {badDebtRows.length > 0 && (
              <span className="ml-2 text-rose-500 dark:text-rose-400">· {badDebtRows.length} bad debt</span>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
