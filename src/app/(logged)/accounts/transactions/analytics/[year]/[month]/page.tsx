"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FiChevronLeft, FiChevronRight, FiArrowUpRight, FiArrowDownLeft } from "react-icons/fi";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

interface MonthlyStats {
  year: number;
  month: number;
  totalTransactions: number;
  officeRecords: {
    totalIncome: number;
    totalExpense: number;
    byCategory?: Array<{
      categoryId: string;
      categoryLabel: string;
      income: number;
      expense: number;
      balance: number;
    }>;
  };
  profit: number;
  netProfit: number;
  paymentMethods: Array<{
    methodId: string;
    methodLabel: string;
    income: number;
    expense: number;
    balance: number;
  }>;
}

export default function MonthlyStatsPage({
  params,
}: {
  params: { year: string; month: string };
}) {
  const year = Number(params.year);
  const month = Number(params.month);
  const isInitialParamsValid = !!year && year >= 2000 && year <= 2100 && !!month && month >= 1 && month <= 12;

  const [displayMonth, setDisplayMonth] = useState(isInitialParamsValid ? month : 1);
  const [displayYear, setDisplayYear] = useState(isInitialParamsValid ? year : 2000);
  const isDisplayParamsValid = displayYear >= 2000 && displayYear <= 2100 && displayMonth >= 1 && displayMonth <= 12;

  const { data, isLoading, error } = useQuery({
    queryKey: ["finance-summary-monthly", displayYear, displayMonth],
    enabled: isDisplayParamsValid,
    queryFn: async () => {
      const response = await axios.get("/api/payment/monthly-stats", {
        params: {
          year: displayYear,
          month: displayMonth,
        },
      });
      return response.data.summary as MonthlyStats;
    },
  });

  const monthName = useMemo(() => {
    return new Date(displayYear, displayMonth - 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [displayYear, displayMonth]);

  if (!isInitialParamsValid) {
    return (
      <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
        <Breadcrumb pageName="Monthly Finance Summary" />
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
          <p className="text-red-700 dark:text-red-300">Invalid year or month provided</p>
        </div>
        <div className="mt-4">
          <Link href="/accounts/transactions/analytics" className="text-blue-600 hover:underline dark:text-blue-400">
            ← Back to Finance Summary
          </Link>
        </div>
      </div>
    );
  }

  const handlePreviousMonth = () => {
    if (displayMonth === 1) {
      setDisplayMonth(12);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayMonth === 12) {
      setDisplayMonth(1);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  const isNetProfitPositive = data && data.netProfit >= 0;
  const isTodayOrBefore =
    new Date(displayYear, displayMonth - 1) <= new Date(new Date().getFullYear(), new Date().getMonth());

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Breadcrumb pageName="Monthly Finance Summary" />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Header with Month Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Monthly Finance Summary</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{monthName}</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handlePreviousMonth}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
            >
              <FiChevronLeft className="h-5 w-5" />
              Previous
            </button>

            <button
              onClick={handleNextMonth}
              disabled={isTodayOrBefore && displayMonth === new Date().getMonth() + 1 && displayYear === new Date().getFullYear()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
            >
              Next
              <FiChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-slate-900">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading monthly statistics...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
            <p className="text-red-700 dark:text-red-300">
              No data available for {monthName}. 
              {isTodayOrBefore ? " Use ?compute=true to generate statistics." : " This month has not occurred yet."}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        {data && !isLoading && (
          <div className="space-y-6">
            {/* Main Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              {/* Total Transactions */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-slate-900">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</div>
                <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {data.totalTransactions}
                </div>
              </div>

              {/* Office Expense */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-slate-900">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Office Expense</div>
                <div className="mt-2 flex items-end gap-2">
                  <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                    {data.officeRecords.totalExpense.toFixed(2)}
                  </div>
                  <FiArrowDownLeft className="mb-1 h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
              </div>

              {/* Profit (Service Fees) */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-slate-900">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Profit Generated</div>
                <div className="mt-2 flex items-end gap-2">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {data.profit.toFixed(2)}
                  </div>
                  <FiArrowUpRight className="mb-1 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>

              {/* Net Profit */}
              <div className={`rounded-lg border p-6 ${
                isNetProfitPositive
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                  : "border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20"
              }`}>
                <div className={`text-sm font-medium ${
                  isNetProfitPositive
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-rose-700 dark:text-rose-300"
                }`}>
                  Net Profit
                </div>
                <div className={`mt-2 flex items-end gap-2 text-3xl font-bold ${
                  isNetProfitPositive
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-rose-700 dark:text-rose-300"
                }`}>
                  {data.netProfit.toFixed(2)}
                  <div className="mb-1">
                    {isNetProfitPositive ? (
                      <FiArrowUpRight className="h-5 w-5" />
                    ) : (
                      <FiArrowDownLeft className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Office Records Breakdown */}
            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-slate-900">
              <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Office Records</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {data.officeRecords.totalIncome.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Expense</p>
                    <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
                      {data.officeRecords.totalExpense.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Office Records by Category */}
                {data.officeRecords.byCategory && data.officeRecords.byCategory.length > 0 && (
                  <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800">
                    <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Office Records by Category</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-800">
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                              Category
                            </th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                              Income
                            </th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                              Expense
                            </th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                              Balance
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.officeRecords.byCategory.map((category) => (
                            <tr key={category.categoryId} className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-slate-800">
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                                {category.categoryLabel}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                {category.income.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-medium text-rose-600 dark:text-rose-400">
                                {category.expense.toFixed(2)}
                              </td>
                              <td className={`px-4 py-3 text-right text-sm font-medium ${
                                category.balance >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}>
                                {category.balance.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Methods Breakdown */}
            {data.paymentMethods.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-slate-900">
                <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Methods</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Method
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          Income
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          Expense
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {data.paymentMethods.map((method) => (
                        <tr
                          key={method.methodId}
                          className="hover:bg-gray-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            {method.methodLabel}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-emerald-600 dark:text-emerald-400">
                            {method.income.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-rose-600 dark:text-rose-400">
                            {method.expense.toFixed(2)}
                          </td>
                          <td className={`px-6 py-4 text-right text-sm font-semibold ${
                            method.balance >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}>
                            {method.balance.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Back Link */}
            <div className="pt-4">
              <Link
                href="/accounts/transactions/analytics"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400"
              >
                ← Back to Finance Summary
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
