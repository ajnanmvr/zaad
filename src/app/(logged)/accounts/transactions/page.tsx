"use client";

import { Suspense } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TransactionList from "@/components/Tables/TransactionList";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiTrendingUp, FiPlusCircle, FiDollarSign, FiTrash2, FiCreditCard, FiBarChart2 } from "react-icons/fi";
import { FiArrowDownLeft } from "react-icons/fi";

const TablesPageContent = () => {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const category = categoryParam === "office_records" || categoryParam === "liability" ? categoryParam : undefined;

  return (
    <>
      <Breadcrumb pageName="Transactions" />

      <section className="relative overflow-hidden rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-5 shadow-sm dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-14 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300">
            <FiTrendingUp />
            Finance Console
          </p>
          <h2 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
            Transactions
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Track all incoming and outgoing transactions with filters, quick actions, and clear client context.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/accounts/add-record"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-700 dark:bg-slate-900 dark:text-blue-300"
            >
              <FiPlusCircle />
              Add Record
            </Link>
            <Link
              href="/accounts/transactions/office"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300"
            >
              <FiDollarSign />
              Office Records
            </Link>
            <Link
              href="/accounts/transactions/self"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-700 dark:bg-slate-900 dark:text-cyan-300"
            >
              <FiDollarSign />
              Self Transfers
            </Link>
            <Link
              href="/accounts/transactions/liability"
              className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 dark:border-violet-700 dark:bg-slate-900 dark:text-violet-300"
            >
              <FiArrowDownLeft />
              Liability
            </Link>
            <Link
              href="/accounts/transactions/credit-list"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300"
            >
              <FiCreditCard />
              Credit List
            </Link>
            <Link
              href="/accounts/transactions/debit-list"
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-700 dark:bg-slate-900 dark:text-rose-300"
            >
              <FiArrowDownLeft />
              Debit List
            </Link>
            <Link
              href="/accounts/transactions/analytics"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-300 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-700 dark:bg-slate-900 dark:text-indigo-300"
            >
              <FiBarChart2 />
              Finance Summary
            </Link>
            <Link
              href="/accounts/transactions/bin"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-700 dark:bg-slate-900 dark:text-amber-300"
            >
              <FiTrash2 />
              Bin
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <TransactionList category={category} />
      </div>
    </>
  );
};

export default function TablesPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="text-sm text-slate-500">Loading...</div></div>}>
      <TablesPageContent />
    </Suspense>
  );
}
