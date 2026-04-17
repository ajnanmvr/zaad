
"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TransactionList from "@/components/Tables/TransactionList";
import { FiBookOpen, FiShield, FiTrendingUp, FiPlusCircle, FiDollarSign } from "react-icons/fi";
import Link from "next/link";

const TablesPage = () => {
  return (
    <>
      <Breadcrumb pageName="Company Records" />

      <section className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 shadow-sm dark:border-emerald-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full bg-teal-300/20 blur-3xl" />

        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-300">
            <FiBookOpen />
            Internal Ledger
          </p>
          <h2 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
            Company Records
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Record and monitor company-only income and expense entries with a focused workflow.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Dataset</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-slate-900 dark:text-slate-100">
                <FiTrendingUp />
                Self Transactions Only
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200/80 bg-white/80 p-4 dark:border-emerald-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Control</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-emerald-600 dark:text-emerald-400">
                <FiShield />
                Internal Audit View
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/accounts/transactions/self/new?type=income"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300"
            >
              <FiPlusCircle />
              Record Company Income
            </Link>
            <Link
              href="/accounts/transactions/self/new?type=expense"
              className="inline-flex items-center gap-2 rounded-xl border border-orange-300 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 dark:border-orange-700 dark:bg-slate-900 dark:text-orange-300"
            >
              <FiDollarSign />
              Record Company Expense
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-6">
      <TransactionList type="self" />
      </div>
    </>
  );
};

export default TablesPage;
