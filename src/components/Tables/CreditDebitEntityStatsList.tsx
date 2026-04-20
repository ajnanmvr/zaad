"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import clsx from "clsx";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import EntityAvatar from "@/components/common/EntityAvatar";
import ExportActionsMenu from "@/components/common/ExportActionsMenu";
import { exportRowsCsv, exportRowsExcel, exportRowsPdf } from "@/utils/exportTableData";
import {
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiRefreshCw,
  FiSearch,
  FiTrendingDown,
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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<"all" | "company" | "employee" | "individual">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isRefreshingLedgerStats, setIsRefreshingLedgerStats] = useState(false);

  const isCredit = mode === "credit";

  const { data, isLoading, isError, isFetching, refetch } = useQuery<EntityRecordStatsResponse>({
    queryKey: ["entity-record-stats", mode],
    queryFn: async () => {
      const { data } = await axios.get("/api/payment/entity-record-stats");
      return data;
    },
  });

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

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount);

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, pageSize, safePage]);

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

  const handleRecomputeLedgerStats = async () => {
    if (isRefreshingLedgerStats) {
      return;
    }

    try {
      setIsRefreshingLedgerStats(true);
      const response = await axios.post("/api/payment/entity-stats/recompute");
      const updatedEntities = Number(response?.data?.updatedEntities || 0);
      const updatedOfficeCategories = Number(response?.data?.updatedOfficeCategories || 0);
      const updatedLiabilityEntities = Number(response?.data?.updatedLiabilityEntities || 0);
      toast.success(
        `Ledger stats refreshed (${updatedEntities} entities, ${updatedOfficeCategories} office categories, ${updatedLiabilityEntities} liability entities)`,
      );
      await queryClient.invalidateQueries({ queryKey: ["entity-record-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["payment"] });
      await queryClient.invalidateQueries({
        queryKey: ["office-records-page-summary"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["liability-records-page-summary"],
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to refresh ledger stats");
    } finally {
      setIsRefreshingLedgerStats(false);
    }
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
          <button
            type="button"
            onClick={() => void handleRecomputeLedgerStats()}
            disabled={isRefreshingLedgerStats}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FiRefreshCw className={clsx((isFetching || isRefreshingLedgerStats) && "animate-spin")} />
            {isRefreshingLedgerStats ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Total Clients</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{filteredRows.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Total Balance</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{formatAmount(totalBalance)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Page</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{safePage} / {pageCount}</p>
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
                setPage(1);
              }}
              placeholder="Search by client name"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          <select
            value={entityTypeFilter}
            onChange={(event) => {
              setEntityTypeFilter(event.target.value as "all" | "company" | "employee" | "individual");
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="all">All Types</option>
            <option value="company">Company</option>
            <option value="employee">Employee</option>
            <option value="individual">Individual</option>
          </select>

          <select
            value={String(pageSize)}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option} / page</option>
            ))}
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
        ) : pagedRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
            No rows found for current filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40">
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Credit</th>
                  <th className="px-4 py-3">Debit</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Transactions</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => (
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
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{formatAmount(row.totalIncome)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{formatAmount(Number(row.totalExpense || 0) + Number(row.totalServiceFee || 0))}</td>
                    <td className={clsx("px-4 py-3 text-sm font-black", isCredit ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>{formatAmount(row.balance)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{Number(row.totalTransactions || 0)}</td>
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {(safePage - 1) * pageSize + (pagedRows.length ? 1 : 0)} to {(safePage - 1) * pageSize + pagedRows.length} of {filteredRows.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage <= 1}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <FiChevronLeft /> Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              disabled={safePage >= pageCount}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
