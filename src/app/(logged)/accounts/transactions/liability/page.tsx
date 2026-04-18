"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import clsx from "clsx";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiExternalLink,
  FiHash,
  FiShield,
} from "react-icons/fi";

type LiabilityEntitySummary = {
  entity: string;
  income: number;
  expense: number;
  net: number;
};

type LiabilityRecord = {
  id: string;
  suffix?: string;
  number?: number;
  particular?: string;
  amount?: string;
  type?: "income" | "expense";
  method?: string;
  client?: {
    name?: string;
  };
};

type LiabilityResponse = {
  records: LiabilityRecord[];
  summary: {
    entities: LiabilityEntitySummary[];
    totals: {
      income: number;
      expense: number;
      net: number;
    };
  };
  pagination: {
    page: number;
    hasMore: boolean;
    total: number;
  };
};

export default function LiabilityPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useQuery<LiabilityResponse>({
    queryKey: ["liability-records-page", page],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/payment/liability-records?page=${page}&limit=20`,
      );
      return data;
    },
  });

  const records = data?.records || [];
  const entities = data?.summary?.entities || [];
  const totals = data?.summary?.totals || { income: 0, expense: 0, net: 0 };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Liability" />

      <section className="relative overflow-hidden rounded-[2rem] border border-violet-300 bg-[linear-gradient(130deg,#f6f0ff_0%,#eef2ff_45%,#f3f4f6_100%)] p-6 shadow-[0_25px_90px_-45px_rgba(67,56,202,0.45)] dark:border-violet-800/40 dark:bg-[linear-gradient(130deg,#120e24_0%,#111827_45%,#1f2937_100%)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-300/30 blur-3xl dark:bg-violet-500/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-60 w-60 rounded-full bg-blue-300/25 blur-3xl dark:bg-blue-500/10" />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/60 bg-violet-100/80 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-violet-800 dark:border-violet-600/40 dark:bg-violet-500/10 dark:text-violet-300">
              <FiShield />
              Liability Board
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Liability Records
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-700 dark:text-slate-300">
              Liability-only view with entity exposure and transaction-level
              drill down.
            </p>
          </div>

          <Link
            href="/accounts/transactions"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/90 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
          >
            <FiArrowLeft />
            All Transactions
          </Link>
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-300/50 bg-white/80 p-4 dark:border-emerald-900/40 dark:bg-slate-900/60">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
              Liability Income
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">
              AED {totals.income.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-300/50 bg-white/80 p-4 dark:border-rose-900/40 dark:bg-slate-900/60">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">
              Liability Expense
            </p>
            <p className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-300">
              AED {totals.expense.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-300/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              Net
            </p>
            <p
              className={clsx(
                "mt-1 text-2xl font-black",
                totals.net >= 0
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-rose-700 dark:text-rose-300",
              )}
            >
              AED {totals.net.toFixed(2)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <h2 className="mb-4 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
          Entity Liability Snapshot
        </h2>
        {entities.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No liability summary found.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {entities.map((row) => (
              <article
                key={row.entity}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/50"
              >
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  {row.entity}
                </h3>
                <div className="mt-3 space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <p>In: AED {row.income.toFixed(2)}</p>
                  <p>Out: AED {row.expense.toFixed(2)}</p>
                  <p
                    className={clsx(
                      "font-black",
                      row.net >= 0
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-rose-700 dark:text-rose-300",
                    )}
                  >
                    Net: AED {row.net.toFixed(2)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Liability Record List
          </h2>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
            {data?.pagination?.total || 0} total
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
            Loading liability records...
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-rose-200 p-8 text-center text-rose-600 dark:border-rose-900/40 dark:text-rose-300">
            Failed to load liability records.
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
            No liability records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Record ID
                  </th>
                  <th className="px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Particular
                  </th>
                  <th className="px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Entity
                  </th>
                  <th className="px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Method
                  </th>
                  <th className="px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    View
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const amount = Number(record.amount || 0);
                  const recordId = `${record.suffix || ""}${record.number || ""}`;
                  const isIncome = record.type === "income";

                  return (
                    <tr
                      key={record.id}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="px-3 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                        {recordId || (
                          <span className="inline-flex items-center gap-1">
                            <FiHash /> -
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {record.particular || "-"}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {record.client?.name || "Unknown"}
                      </td>
                      <td
                        className={clsx(
                          "px-3 py-3 text-sm font-black",
                          isIncome
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-rose-700 dark:text-rose-300",
                        )}
                      >
                        AED {amount.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {record.method || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/accounts/transactions/details/${record.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Open <FiExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <FiAlertCircle /> Liability records only
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={page === 0}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!data?.pagination?.hasMore}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
