"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import SelfDepositCompactTable from "@/components/Tables/SelfDepositCompactTable";
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiPlus } from "react-icons/fi";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type SelfDepositStats = {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalTransactions: number;
};

const SelfDepositTrackingPage = () => {
  const { data: stats } = useQuery<SelfDepositStats>({
    queryKey: ["self-deposit-stats"],
    queryFn: async () => {
      const { data } = await axios.get("/api/payment/self-deposit?page=0");
      return {
        balance: data.balance || 0,
        totalIncome: data.totalIncome || 0,
        totalExpense: data.totalExpense || 0,
        totalTransactions: data.totalTransactions || 0,
      };
    },
  });

  const formatAmount = (value: number) => {
    return `${Number(value || 0).toFixed(2)} AED`;
  };

  return (
    <>
      <Breadcrumb pageName="Self Deposit" />

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Self Deposit Management</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Move funds between your payment methods seamlessly</p>
          </div>
          <Link
            href="/accounts/transactions/self-deposit/new"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:from-emerald-600 hover:to-emerald-700"
          >
            <FiPlus className="h-4 w-4" /> New Transfer
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Transfers</p>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100">{stats?.totalTransactions || 0}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">All time</p>
            </div>
          </div>
        </div>

        <div className="group rounded-xl border border-emerald-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-lg dark:border-emerald-500/20 dark:bg-slate-900/50 dark:hover:border-emerald-500/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Income</p>
              <p className="mt-3 text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatAmount(stats?.totalIncome || 0)}</p>
              <p className="mt-1 text-xs text-emerald-600/60 dark:text-emerald-400/60">Incoming transfers</p>
            </div>
            <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <FiTrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="group rounded-xl border border-rose-200 bg-white p-5 transition hover:border-rose-300 hover:shadow-lg dark:border-rose-500/20 dark:bg-slate-900/50 dark:hover:border-rose-500/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Total Expense</p>
              <p className="mt-3 text-2xl font-black text-rose-600 dark:text-rose-400">{formatAmount(stats?.totalExpense || 0)}</p>
              <p className="mt-1 text-xs text-rose-600/60 dark:text-rose-400/60">Outgoing transfers</p>
            </div>
            <div className="rounded-lg bg-rose-100 p-3 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <FiTrendingDown className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="group rounded-xl border border-cyan-200 bg-white p-5 transition hover:border-cyan-300 hover:shadow-lg dark:border-cyan-500/20 dark:bg-slate-900/50 dark:hover:border-cyan-500/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Net Balance</p>
              <p className="mt-3 text-2xl font-black text-cyan-600 dark:text-cyan-400">{formatAmount(stats?.balance || 0)}</p>
              <p className="mt-1 text-xs text-cyan-600/60 dark:text-cyan-400/60">Current position</p>
            </div>
            <div className="rounded-lg bg-cyan-100 p-3 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400">
              <FiDollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <SelfDepositCompactTable />
    </>
  );
};

export default SelfDepositTrackingPage;
