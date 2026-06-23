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
import { FiRefreshCw } from "react-icons/fi";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import EntityAvatar from "@/components/common/EntityAvatar";
import ExportActionsMenu from "@/components/common/ExportActionsMenu";
import { exportRowsCsv, exportRowsExcel, exportRowsPdf } from "@/utils/exportTableData";
import {
  FiArrowRight,
  FiCreditCard,
  FiSearch,
  FiTrendingUp,
} from "react-icons/fi";

type ViewMode = "credit" | "debit";

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
};

type EntityRecordStatsResponse = {
  summary: {
    creditRows: EntityRecordStatRow[];
    debitRows: EntityRecordStatRow[];
  };
};

const formatAmount = (value: number) => `AED ${Math.abs(Number(value || 0)).toFixed(2)}`;

const toEntityRouteType = (entityType: string) => {
  if (entityType === "employee" || entityType === "individual" || entityType === "company") {
    return entityType;
  }
  return "company";
};

const toEntityTypeLabel = (entityType: string) => {
  if (entityType === "employee") return "Employee";
  if (entityType === "individual") return "Individual";
  if (entityType === "company") return "Company";
  return "Unknown";
};

export default function CreditDebitEntityStatsList({ mode }: { mode: ViewMode }) {
  const [search, setSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<"all" | "company" | "employee" | "individual">("all");

  const isCredit = mode === "credit";

  const { data, isLoading, isError, isFetching, refetch } = useQuery<EntityRecordStatsResponse>({
    queryKey: ["entity-record-stats", mode],
    queryFn: async () => {
      const { data } = await axios.get("/api/payment/entity-record-stats");
      return data;
    },
  });

  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const permissions = user?.permissions && Array.isArray(user.permissions) ? (user.permissions as string[]) : [];
  const canAdminRefresh = user ? hasPermission(permissions, "payments.manage.recompute-monthly-stats") || hasPermission(permissions, "payments.admin") || hasPermission(permissions, "admin.access") : false;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const baseRows = useMemo(() => {
    const rows = isCredit ? data?.summary?.creditRows || [] : data?.summary?.debitRows || [];
    return rows.filter((row) => Number(row.balance || 0) !== 0);
  }, [data?.summary?.creditRows, data?.summary?.debitRows, isCredit]);

  const filteredRows = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return baseRows.filter((row) => {
      if (entityTypeFilter !== "all" && row.entityType !== entityTypeFilter) {
        return false;
      }

      if (!searchText) {
        return true;
      }

      return (
        String(row.entityName || "").toLowerCase().includes(searchText) ||
        String(row.entity || "").toLowerCase().includes(searchText)
      );
    });
  }, [baseRows, entityTypeFilter, search]);

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
      })),
    [filteredRows],
  );

  const onExport = async (format: "csv" | "excel" | "pdf", _modeType: "selected" | "all") => {
    const rows = exportRows;
    if (!rows.length) return;

    const filePrefix = isCredit ? "credit-entities" : "debit-entities";
    if (format === "csv") {
      exportRowsCsv(rows, filePrefix);
      return;
    }

    if (format === "excel") {
      exportRowsExcel(rows, filePrefix);
      return;
    }

    await exportRowsPdf(rows, filePrefix);
  };

  const headingTitle = isCredit ? "Credit List" : "Debit List";
  const headingAccent = isCredit
    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300"
    : "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-300";

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

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Total Clients</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{filteredRows.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Total</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{formatAmount(totalBalance)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder="Search by client name"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          <select
            value={entityTypeFilter}
            onChange={(event) => {
              setEntityTypeFilter(event.target.value as "all" | "company" | "employee" | "individual");
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="all">All Types</option>
            <option value="company">Company</option>
            <option value="employee">Employee</option>
            <option value="individual">Individual</option>
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
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.entity}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <EntityAvatar name={row.entityName || "Client"} color={row.entityColor} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{row.entityName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {toEntityTypeLabel(row.entityType)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={clsx("px-4 py-3 text-sm font-black", isCredit ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>{formatAmount(row.balance)}</td>
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
          </p>
        </div>
      </section>
    </div>
  );
}
