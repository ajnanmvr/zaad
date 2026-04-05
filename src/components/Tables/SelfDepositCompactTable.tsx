"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiLoader, FiCalendar } from "react-icons/fi";

import PaymentMethodBadge from "@/components/common/PaymentMethodBadge";
import { formatRelativeDate } from "@/utils/dateUtils";

type SelfDepositRow = {
  id: string;
  expense?: {
    id: string;
    method?: string;
    particular?: string;
    amount?: string;
    dateTime?: string;
    createdAt?: string;
    client?: { name: string; type: string } | null;
  };
  income?: {
    id: string;
    method?: string;
    particular?: string;
    amount?: string;
    dateTime?: string;
    createdAt?: string;
    client?: { name: string; type: string } | null;
  };
};

type SelfDepositResponse = {
  records: SelfDepositRow[];
  count: number;
  hasMore: boolean;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalTransactions: number;
};

type PaymentMethodOption = {
  value: string;
  label: string;
  color?: string;
  icon?: string;
};

const formatAmount = (value?: string | number) => {
  const numeric = typeof value === "string" ? Number(value) : value;
  return `${Number(numeric || 0).toFixed(2)} AED`;
};

export default function SelfDepositCompactTable() {
  const [pageNumber, setPageNumber] = useState(0);

  const { data: paymentMethodOptions = [] } = useQuery<PaymentMethodOption[]>({
    queryKey: ["payment-method-templates"],
    queryFn: async () => {
      const { data } = await axios.get("/api/templates", { params: { type: "payment" } });
      return (data?.options || []).map((item: any) => ({
        value: item.method,
        label: item.label || item.method,
        color: item.color,
        icon: item.icon,
      }));
    },
  });

  const paymentMethodMap = useMemo(() => {
    return paymentMethodOptions.reduce<Record<string, PaymentMethodOption>>((acc, item) => {
      acc[item.value] = item;
      return acc;
    }, {});
  }, [paymentMethodOptions]);

  const { data, isLoading, isFetching } = useQuery<SelfDepositResponse>({
    queryKey: ["self-deposit-transfers", pageNumber],
    queryFn: async () => {
      const { data: response } = await axios.get(`/api/payment/self-deposit?page=${pageNumber}`);
      return response;
    },
    placeholderData: (previous) => previous,
  });

  const transfers = data?.records || [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div className="inline-flex w-full items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <div>
          <h4 className="font-black text-slate-900 dark:text-slate-100">Transfer Records</h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{data?.totalTransactions || 0} total transfers</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <FiCalendar className="h-3.5 w-3.5" /> Date
                </span>
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">From</th>
              <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"></th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">To</th>
              <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12">
                  <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                    <FiLoader className="animate-spin" />
                    <span className="text-sm">Loading transfers...</span>
                  </div>
                </td>
              </tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
                      <FiArrowRight className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No transfers yet</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">Create your first transfer above</p>
                  </div>
                </td>
              </tr>
            ) : (
              transfers.map((transfer) => {
                const expense = transfer.expense;
                const income = transfer.income;
                const methodNameExpense = expense ? paymentMethodMap[expense.method || ""]?.label || expense.method || "Unknown" : "Unknown";
                const methodNameIncome = income ? paymentMethodMap[income.method || ""]?.label || income.method || "Unknown" : "Unknown";
                const transferDate = income?.createdAt || expense?.createdAt || income?.dateTime || expense?.dateTime || null;

                return (
                  <tr key={transfer.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {transferDate ? formatRelativeDate(transferDate) : "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <PaymentMethodBadge
                          label={methodNameExpense}
                          color={expense ? paymentMethodMap[expense.method || ""]?.color : undefined}
                          icon={expense ? paymentMethodMap[expense.method || ""]?.icon : undefined}
                          size="sm"
                        />
                        <span className="hidden text-sm font-semibold text-slate-900 dark:text-slate-100 sm:inline">{methodNameExpense}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <FiArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <PaymentMethodBadge
                          label={methodNameIncome}
                          color={income ? paymentMethodMap[income.method || ""]?.color : undefined}
                          icon={income ? paymentMethodMap[income.method || ""]?.icon : undefined}
                          size="sm"
                        />
                        <span className="hidden text-sm font-semibold text-slate-900 dark:text-slate-100 sm:inline">{methodNameIncome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                        {formatAmount(expense?.amount)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {transfers.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-700">
          <p className="hidden text-xs font-medium text-slate-600 dark:text-slate-400 sm:block">
            Page <span className="font-bold text-slate-900 dark:text-slate-100">{pageNumber + 1}</span>
          </p>
          <div className="flex flex-1 justify-between gap-2 sm:justify-end">
            <button
              onClick={() => setPageNumber((current) => Math.max(current - 1, 0))}
              disabled={pageNumber === 0 || isLoading || isFetching}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:disabled:border-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-600 uppercase tracking-wider"
            >
              <FiChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              onClick={() => setPageNumber((current) => current + 1)}
              disabled={isLoading || isFetching || !data?.hasMore || !transfers.length}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:disabled:border-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-600 uppercase tracking-wider"
            >
              Next <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
