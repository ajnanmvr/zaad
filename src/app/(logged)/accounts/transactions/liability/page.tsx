"use client";

import Link from "next/link";
import axios from "axios";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FiArrowLeft, FiPlusCircle, FiShield } from "react-icons/fi";

type LiabilityEntitySummary = {
  entity: string;
  income: number;
  expense: number;
  net: number;
};

type LiabilityResponse = {
  summary: {
    entities: LiabilityEntitySummary[];
    totals: {
      income: number;
      expense: number;
      net: number;
    };
  };
};

export default function LiabilityPage() {
  const { data, isLoading, isError } = useQuery<LiabilityResponse>({
    queryKey: ["liability-records-page-summary"],
    queryFn: async () => {
      const { data } = await axios.get("/api/payment/liability-records");
      return data;
    },
  });

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
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Liability Records</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-700 dark:text-slate-300">
              Liability summary view across all linked entities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/accounts/add-record?recordKind=liability&type=income"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white/90 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-white dark:border-emerald-700 dark:bg-slate-900/80 dark:text-emerald-300"
            >
              <FiPlusCircle /> + Income
            </Link>
            <Link
              href="/accounts/add-record?recordKind=liability&type=expense"
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white/90 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-white dark:border-rose-700 dark:bg-slate-900/80 dark:text-rose-300"
            >
              <FiPlusCircle /> + Expense
            </Link>
            <Link
              href="/accounts/transactions?category=liability"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/90 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
            >
              <FiArrowLeft /> View Liability Transactions
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-300/50 bg-white/80 p-4 dark:border-emerald-900/40 dark:bg-slate-900/60">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Liability Income</p>
            <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">AED {totals.income.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-rose-300/50 bg-white/80 p-4 dark:border-rose-900/40 dark:bg-slate-900/60">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">Liability Expense</p>
            <p className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-300">AED {totals.expense.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-slate-300/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Net</p>
            <p className={clsx("mt-1 text-2xl font-black", totals.net >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>AED {totals.net.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <h2 className="mb-4 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">Entity Liability Snapshot</h2>
        {isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading liability summary...</p>
        ) : isError ? (
          <p className="text-sm text-rose-600 dark:text-rose-300">Failed to load liability summary.</p>
        ) : entities.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No liability summary found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {entities.map((row) => (
              <article key={row.entity} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">{row.entity}</h3>
                <div className="mt-3 space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <p>In: AED {row.income.toFixed(2)}</p>
                  <p>Out: AED {row.expense.toFixed(2)}</p>
                  <p className={clsx("font-black", row.net >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>Net: AED {row.net.toFixed(2)}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
