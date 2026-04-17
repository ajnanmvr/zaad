"use client";

import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import InstantProfitModal from "@/components/Modals/InstantProfitModal";
import TransactionList from "@/components/Tables/TransactionList";
import Link from "next/link";
import { FiBookOpen, FiCreditCard, FiTrendingUp, FiPlusCircle, FiShield } from "react-icons/fi";

const TablesPage = () => {
  const [showInstantProfitModal, setShowInstantProfitModal] = useState(false);

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

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Scope</p>
              <p className="mt-1 text-sm font-black text-slate-900 dark:text-slate-100">All Accounts</p>
            </div>
            <div className="rounded-2xl border border-emerald-200/80 bg-white/80 p-4 dark:border-emerald-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-emerald-600 dark:text-emerald-400">
                <FiBookOpen />
                Income / Expense
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-200/80 bg-white/80 p-4 dark:border-cyan-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Review</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-cyan-600 dark:text-cyan-400">
                <FiCreditCard />
                Detailed History
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/accounts/expense/company"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-700 dark:bg-slate-900 dark:text-cyan-300"
            >
              <FiPlusCircle />
              Company Expense
            </Link>
            <Link
              href="/accounts/transactions/liability/new"
              className="inline-flex items-center gap-2 rounded-xl border border-orange-300 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 dark:border-orange-700 dark:bg-slate-900 dark:text-orange-300"
            >
              <FiShield />
              Liability Entry
            </Link>
            <button
              type="button"
              onClick={() => setShowInstantProfitModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 dark:border-violet-700 dark:bg-slate-900 dark:text-violet-300"
            >
              <FiTrendingUp />
              Instant Profit
            </button>
          </div>
        </div>
      </section>

      <InstantProfitModal
        isOpen={showInstantProfitModal}
        onCancel={() => setShowInstantProfitModal(false)}
      />

      <div className="mt-6">
      <TransactionList />
      </div>
    </>
  );
};

export default TablesPage;
