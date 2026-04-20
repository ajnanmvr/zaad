"use client";

import axios from "axios";
import clsx from "clsx";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiArrowLeft, FiBarChart2, FiDollarSign, FiTrendingUp, FiActivity, FiCalendar } from "react-icons/fi";

type FinanceSummaryResponse = {
  summary: {
    totalTransactions: number;
  };
};

type OfficeRecordsResponse = {
  summary: {
    totalExpense: number;
  };
};

type EntityRecordStatRow = {
  totalServiceFee: number;
};

type EntityRecordStatsResponse = {
  summary: {
    creditRows: EntityRecordStatRow[];
    debitRows: EntityRecordStatRow[];
  };
};

type MonthlyStatsData = {
  year: number;
  month: number;
  totalTransactions: number;
  officeRecords: {
    totalIncome: number;
    totalExpense: number;
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
};

const formatCurrency = (value: number) => `AED ${Number(value || 0).toFixed(2)}`;

const getMonthName = (month: number, year: number) => {
  return new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

export default function FinanceAnalyticsPage() {
  const { data: financeSummary, isLoading: isFinanceSummaryLoading } = useQuery<FinanceSummaryResponse>({
    queryKey: ["finance-summary"],
    queryFn: async () => {
      const { data } = await axios.get("/api/payment/finance-summary");
      return data;
    },
  });

  const { data: officeSummary, isLoading: isOfficeSummaryLoading } = useQuery<OfficeRecordsResponse>({
    queryKey: ["office-records-page-summary", ""],
    queryFn: async () => {
      const { data } = await axios.get("/api/payment/office-records");
      return data;
    },
  });

  const { data: entityStats, isLoading: isEntityStatsLoading } = useQuery<EntityRecordStatsResponse>({
    queryKey: ["entity-record-stats", "analytics"],
    queryFn: async () => {
      const { data } = await axios.get("/api/payment/entity-record-stats");
      return data;
    },
  });

  // Get current month stats
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Generate last 6 months for display
  const recentMonths = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      let month = currentMonth - i;
      let year = currentYear;
      
      while (month <= 0) {
        month += 12;
        year -= 1;
      }
      
      months.push({ year, month });
    }
    return months;
  }, [currentYear, currentMonth]);

  // Fetch monthly stats for recent months
  const { data: monthlyStatsData, isLoading: isMonthlyStatsLoading } = useQuery({
    queryKey: ["finance-summary-monthly-list"],
    queryFn: async () => {
      const monthlyData: Record<string, MonthlyStatsData> = {};
      
      for (const { year, month } of recentMonths) {
        try {
          const response = await axios.get("/api/payment/monthly-stats", {
            params: { year, month },
          });
          monthlyData[`${year}-${month}`] = response.data.summary;
        } catch (error) {
          // Skip if monthly stats not available
        }
      }
      
      return monthlyData;
    },
  });

  const totalTransactions = Number(financeSummary?.summary?.totalTransactions || 0);
  const officeRecordsExpense = Number(officeSummary?.summary?.totalExpense || 0);

  const profitGenerated = useMemo(() => {
    const creditRows = entityStats?.summary?.creditRows || [];
    const debitRows = entityStats?.summary?.debitRows || [];
    const allRows = [...creditRows, ...debitRows];

    return Number(
      allRows
        .reduce((sum, row) => sum + Number(row.totalServiceFee || 0), 0)
        .toFixed(2),
    );
  }, [entityStats?.summary?.creditRows, entityStats?.summary?.debitRows]);

  const netProfit = Number((profitGenerated - officeRecordsExpense).toFixed(2));

  const isLoading = isFinanceSummaryLoading || isOfficeSummaryLoading || isEntityStatsLoading;

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Finance Summary" />

      <section className="rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 shadow-sm dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1 text-xs font-black uppercase tracking-wider text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300">
              <FiBarChart2 /> Finance Snapshot
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Finance Summary</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Consolidated overview from transactions, office records, and entity stats.
            </p>
          </div>

          <Link
            href="/accounts/transactions"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <FiArrowLeft /> Back to Transactions
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            <FiActivity /> Total Transactions
          </p>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100">
            {isLoading ? "..." : totalTransactions.toLocaleString()}
          </p>
        </article>

        <article className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm dark:border-rose-800/60 dark:bg-rose-900/10">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300">
            <FiDollarSign /> Office Records Expense
          </p>
          <p className="mt-3 text-3xl font-black text-rose-700 dark:text-rose-300">
            {isLoading ? "..." : formatCurrency(officeRecordsExpense)}
          </p>
        </article>

        <article className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-800/60 dark:bg-emerald-900/10">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">
            <FiTrendingUp /> Profit Generated (Service Fees)
          </p>
          <p className="mt-3 text-3xl font-black text-emerald-700 dark:text-emerald-300">
            {isLoading ? "..." : formatCurrency(profitGenerated)}
          </p>
        </article>

        <article className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-5 shadow-sm dark:border-cyan-800/60 dark:bg-cyan-900/10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Net Profit</p>
          <p
            className={clsx(
              "mt-3 text-3xl font-black",
              netProfit >= 0
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-rose-700 dark:text-rose-300",
            )}
          >
            {isLoading ? "..." : formatCurrency(netProfit)}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Profit - Office Expense
          </p>
        </article>
      </section>

      {/* Monthly Stats Trend Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-6">
          <FiCalendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Monthly Trends (Last 6 Months)</h2>
        </div>

        {isMonthlyStatsLoading && (
          <div className="text-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-slate-600 dark:border-t-blue-400"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Loading monthly data...</p>
          </div>
        )}

        {!isMonthlyStatsLoading && recentMonths.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Month
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Transactions
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Profit
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Office Expense
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Net Profit
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {recentMonths.map(({ year, month }) => {
                  const key = `${year}-${month}`;
                  const stats = monthlyStatsData?.[key];

                  return (
                    <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {getMonthName(month, year)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                        {stats?.totalTransactions || "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {stats ? formatCurrency(stats.profit) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-rose-600 dark:text-rose-400">
                        {stats ? formatCurrency(stats.officeRecords.totalExpense) : "—"}
                      </td>
                      <td className={clsx(
                        "px-4 py-3 text-right text-sm font-semibold",
                        stats && stats.netProfit >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      )}>
                        {stats ? formatCurrency(stats.netProfit) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {stats ? (
                          <Link
                            href={`/accounts/transactions/analytics/${year}/${month}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                          >
                            View
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
