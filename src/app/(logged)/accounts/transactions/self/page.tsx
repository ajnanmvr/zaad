"use client";

import { useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  FiArrowLeft,
  FiGrid,
  FiPlusCircle,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";

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

export default function OfficeRecordsPage() {
  const { data, isLoading, isError } = useQuery<OfficeResponse>({
    queryKey: ["office-records-page-summary"],
    queryFn: async () => {
      const { data } = await axios.get("/api/payment/office-records");
      return data;
    },
  });

  const expenseByCategory = data?.summary?.expenseByCategory || [];
  const incomeByCategory = data?.summary?.incomeByCategory || [];
  const totalIncome = data?.summary?.totalIncome || 0;
  const totalExpense = data?.summary?.totalExpense || 0;

  const net = useMemo(() => Number((totalIncome - totalExpense).toFixed(2)), [totalIncome, totalExpense]);

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Office Records" />

      <section className="relative overflow-hidden rounded-[2rem] border border-amber-300 bg-[linear-gradient(140deg,#fff6db_0%,#ffedd5_40%,#e2fbe8_100%)] p-6 shadow-[0_25px_90px_-45px_rgba(120,53,15,0.45)] dark:border-amber-700/40 dark:bg-[linear-gradient(140deg,#1f1304_0%,#1b1a10_45%,#0e2216_100%)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-60 w-60 rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-500/10" />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-amber-100/80 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-amber-800 dark:border-amber-600/40 dark:bg-amber-500/10 dark:text-amber-300">
              <FiGrid />
              Office Ledger Matrix
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Office Records</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-700 dark:text-slate-300">
              Category-wise expense and income with advanced record controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/accounts/add-record?recordKind=office_records&type=income"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white/90 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-white dark:border-emerald-700 dark:bg-slate-900/80 dark:text-emerald-300"
            >
              <FiPlusCircle /> Income
            </Link>
            <Link
              href="/accounts/add-record?recordKind=office_records&type=expense"
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white/90 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-white dark:border-rose-700 dark:bg-slate-900/80 dark:text-rose-300"
            >
              <FiPlusCircle /> Expense
            </Link>
            <Link
              href="/accounts/transactions?category=office_records"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/90 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
            >
              <FiArrowLeft /> View Office Transactions
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-300/60 bg-white/75 p-4 dark:border-emerald-700/40 dark:bg-slate-900/60">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Total Income</p>
            <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">AED {totalIncome.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-rose-300/60 bg-white/75 p-4 dark:border-rose-700/40 dark:bg-slate-900/60">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">Total Expense</p>
            <p className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-300">AED {totalExpense.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-slate-300/70 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Net</p>
            <p className={clsx("mt-1 text-2xl font-black", net >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>AED {net.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-rose-200 bg-white p-5 shadow-sm dark:border-rose-900/40 dark:bg-slate-900/60">
          <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-black tracking-tight text-rose-700 dark:text-rose-300">
            <FiTrendingDown /> Expense By Category
          </h2>
          <div className="space-y-2">
            {expenseByCategory.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No expense records found.</p>
            ) : (
              expenseByCategory.map((row) => (
                <div key={`exp-${row.category}`} className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-2.5 dark:border-rose-900/40 dark:bg-rose-900/10">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{row.category}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{row.count} records</p>
                  </div>
                  <p className="text-sm font-black text-rose-700 dark:text-rose-300">AED {row.total.toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900/40 dark:bg-slate-900/60">
          <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-black tracking-tight text-emerald-700 dark:text-emerald-300">
            <FiTrendingUp /> Income By Category
          </h2>
          <div className="space-y-2">
            {incomeByCategory.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No income records found.</p>
            ) : (
              incomeByCategory.map((row) => (
                <div key={`inc-${row.category}`} className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-900/10">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{row.category}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{row.count} records</p>
                  </div>
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">AED {row.total.toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">Loading office summary...</div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 p-8 text-center text-rose-600 dark:border-rose-900/40 dark:text-rose-300">Failed to load office summary.</div>
      ) : null}
    </div>
  );
}
