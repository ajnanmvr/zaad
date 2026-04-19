"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FiArrowRight, FiArrowLeft, FiChevronsRight, FiFilter, FiRefreshCw } from "react-icons/fi";

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
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");
  const [sort, setSort] = useState("newest");

  const { data, isLoading, isError, refetch } = useQuery<SelfTransfersResponse>({
    queryKey: ["self-transfers-page", page, search, method, sort],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (search.trim()) params.set("q", search.trim());
      if (method) params.set("m", method);
      if (sort) params.set("sort", sort);
      const response = await axios.get(`/api/payment/self-deposit?${params.toString()}`);
      return response.data;
    },
  });

  const rows = data?.records || [];

  const methodOptions = useMemo(() => {
    const values = new Set<string>();
    rows.forEach((row) => {
      if (row.expense?.method) values.add(row.expense.method);
      if (row.income?.method) values.add(row.income.method);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const thisMonth = data?.report?.thisMonthTransfers || 0;
  const allTime = data?.report?.allTimeTransfers || 0;

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

          <Link
            href="/accounts/add-record?recordKind=self_transfer"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-white px-4 py-2 text-sm font-bold text-cyan-700 hover:bg-cyan-50 dark:border-cyan-700 dark:bg-slate-900 dark:text-cyan-300"
          >
            Create Self Transfer
          </Link>
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
    </div>
  );
}
