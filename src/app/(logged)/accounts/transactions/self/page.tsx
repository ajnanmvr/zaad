"use client";

import { useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FiArrowRight, FiGrid, FiPlusCircle } from "react-icons/fi";

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

type CategoryMatrixRow = {
  category: string;
  income: number;
  expense: number;
  incomeCount: number;
  expenseCount: number;
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

  const rows = useMemo(() => {
    const matrix = new Map<string, CategoryMatrixRow>();

    for (const row of incomeByCategory) {
      matrix.set(row.category, {
        category: row.category,
        income: row.total,
        expense: matrix.get(row.category)?.expense || 0,
        incomeCount: row.count,
        expenseCount: matrix.get(row.category)?.expenseCount || 0,
      });
    }

    for (const row of expenseByCategory) {
      matrix.set(row.category, {
        category: row.category,
        income: matrix.get(row.category)?.income || 0,
        expense: row.total,
        incomeCount: matrix.get(row.category)?.incomeCount || 0,
        expenseCount: row.count,
      });
    }

    return Array.from(matrix.values()).sort((a, b) => a.category.localeCompare(b.category));
  }, [expenseByCategory, incomeByCategory]);

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Office Records" />

      <section className="rounded-3xl border border-amber-300/60 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-6 dark:border-amber-700/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-800 dark:border-amber-600/40 dark:bg-amber-500/10 dark:text-amber-300">
              <FiGrid /> Office Summary
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Office Records</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Category matrix for office income and expense.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/accounts/add-record?recordKind=office_records&type=income"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300"
            >
              <FiPlusCircle /> Income
            </Link>
            <Link
              href="/accounts/add-record?recordKind=office_records&type=expense"
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:bg-slate-900 dark:text-rose-300"
            >
              <FiPlusCircle /> Expense
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-300/60 bg-white/80 p-4 dark:border-emerald-700/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Total Income</p>
            <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">AED {totalIncome.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-rose-300/60 bg-white/80 p-4 dark:border-rose-700/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">Total Expense</p>
            <p className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-300">AED {totalExpense.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-slate-300/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Net</p>
            <p className={clsx("mt-1 text-2xl font-black", net >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>AED {net.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <h2 className="mb-4 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">Office Categories</h2>

        {isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading office categories...</p>
        ) : isError ? (
          <p className="text-sm text-rose-600 dark:text-rose-300">Failed to load office categories.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No office categories found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Income</th>
                  <th className="px-3 py-2">Expense</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.category} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-3 text-sm font-bold text-slate-800 dark:text-slate-100">{row.category}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">AED {row.income.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">AED {row.expense.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/accounts/transactions?category=office_records&q=${encodeURIComponent(row.category)}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 hover:bg-cyan-100 dark:border-cyan-700/40 dark:bg-cyan-900/20 dark:text-cyan-300"
                      >
                        Show Transactions <FiArrowRight />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
