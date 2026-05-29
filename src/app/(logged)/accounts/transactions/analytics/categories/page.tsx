"use client";

import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FiArrowLeft } from "react-icons/fi";

type MonthlyCategory = {
  categoryId: string;
  categoryLabel: string;
  income: number;
  expense: number;
  balance: number;
};

type MonthlyPaymentMethod = {
  methodId: string;
  methodLabel: string;
  income: number;
  expense: number;
  balance: number;
};

type MonthlyStatsData = {
  year: number;
  month: number;
  totalTransactions: number;
  officeRecords: {
    totalIncome: number;
    totalExpense: number;
    byCategory?: MonthlyCategory[];
  };
  profit: number;
  netProfit: number;
  paymentMethods: MonthlyPaymentMethod[];
};

type MonthlyStatsListResponse = {
  success: boolean;
  summary: MonthlyStatsData[];
};

const formatCurrency = (value: number) => `AED ${Number(value || 0).toFixed(2)}`;

const monthLabel = (month: number, year: number) =>
  new Date(year, month - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });

export default function AnalyticsCategoriesPage() {
  const { data, isLoading, isError } = useQuery<MonthlyStatsListResponse>({
    queryKey: ["finance-summary-monthly-list"],
    queryFn: async () => {
      const { data } = await axios.get("/api/payment/monthly-stats/list");
      return data;
    },
  });

  const sorted = useMemo(
    () => [...(data?.summary || [])].sort((a, b) => a.year - b.year || a.month - b.month),
    [data?.summary],
  );
  const latest = sorted[sorted.length - 1];
  const rows = useMemo(
    () => [...(latest?.officeRecords?.byCategory || [])].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)),
    [latest?.officeRecords?.byCategory],
  );

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="All Office Categories" />

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Latest Month Category List</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Full office income and expense categories for {latest ? monthLabel(latest.month, latest.year) : "the latest cached month"}.
          </p>
        </div>
        <Link
          href="/accounts/transactions/analytics"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <FiArrowLeft /> Back to Summary
        </Link>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-3 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Category</th>
                  <th className="px-3 py-3 text-right text-xs font-black uppercase tracking-wider text-slate-500">Income</th>
                  <th className="px-3 py-3 text-right text-xs font-black uppercase tracking-wider text-slate-500">Expense</th>
                  <th className="px-3 py-3 text-right text-xs font-black uppercase tracking-wider text-slate-500">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {rows.length > 0 ? rows.map((item, index) => (
                  <tr key={item.categoryId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">#{index + 1} {item.categoryLabel}</td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-emerald-600 dark:text-emerald-300">{formatCurrency(item.income)}</td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-rose-600 dark:text-rose-300">{formatCurrency(item.expense)}</td>
                    <td className={clsx("px-3 py-3 text-right text-sm font-semibold", item.balance >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300")}>
                      {formatCurrency(item.balance)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No category data found in latest month.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isError && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
          Failed to load monthly stats.
        </section>
      )}
    </div>
  );
}
