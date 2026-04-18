"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMemo, useState } from "react";
import { FiArrowDownLeft, FiArrowRight, FiArrowUpRight, FiChevronLeft, FiChevronRight, FiClock, FiLoader, FiRefreshCw } from "react-icons/fi";

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

const formatTransferDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  }

  return formatRelativeDate(dateString);
};

export default function SelfDepositTrackingList() {
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
    <section className="rounded-3xl border border-cyan-200/70 bg-white p-5 shadow-sm dark:border-cyan-900/30 dark:bg-slate-900/60 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300">
            <FiRefreshCw /> Transfer Flow
          </p>
          <h3 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
            Self Deposit Transfers
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Each transfer is merged into one entry with the outgoing method, incoming method, and amount shown together.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
          {data?.totalTransactions || 0} transfers
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-slate-500 dark:text-slate-400">
            <FiLoader className="animate-spin" />
            Loading transfer history...
          </div>
        ) : transfers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No self deposit transfers found.
          </div>
        ) : (
          transfers.map((transfer) => {
            const expense = transfer.expense;
            const income = transfer.income;
            const methodNameExpense = expense ? paymentMethodMap[expense.method || ""]?.label || expense.method || "Unknown" : "Unknown";
            const methodNameIncome = income ? paymentMethodMap[income.method || ""]?.label || income.method || "Unknown" : "Unknown";
            const transferDate = income?.createdAt || expense?.createdAt || income?.dateTime || expense?.dateTime || null;

            return (
              <article key={transfer.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70 shadow-sm transition hover:border-cyan-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-cyan-900/40">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Transfer Entry
                      </p>
                      <h4 className="mt-1 text-base font-black text-slate-900 dark:text-slate-100">
                        {expense?.particular || income?.particular || "Self deposit transfer"}
                      </h4>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
                      <FiClock /> {formatTransferDate(transferDate)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto_1fr] sm:p-6">
                  <div className="rounded-2xl border border-rose-200/70 bg-white p-4 dark:border-rose-900/30 dark:bg-slate-900/70">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                      <FiArrowDownLeft />
                      <span className="text-xs font-bold uppercase tracking-wider">Outgoing</span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <PaymentMethodBadge
                        label={methodNameExpense}
                        color={expense ? paymentMethodMap[expense.method || ""]?.color : undefined}
                        icon={expense ? paymentMethodMap[expense.method || ""]?.icon : undefined}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{methodNameExpense}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{expense?.particular || "Expense leg"}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-lg font-black text-rose-600 dark:text-rose-400">
                      {formatAmount(expense?.amount)}
                    </p>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700 shadow-sm dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
                      <FiArrowRight className="text-xl" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200/70 bg-white p-4 dark:border-emerald-900/30 dark:bg-slate-900/70">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <FiArrowUpRight />
                      <span className="text-xs font-bold uppercase tracking-wider">Incoming</span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <PaymentMethodBadge
                        label={methodNameIncome}
                        color={income ? paymentMethodMap[income.method || ""]?.color : undefined}
                        icon={income ? paymentMethodMap[income.method || ""]?.icon : undefined}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{methodNameIncome}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{income?.particular || "Income leg"}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {formatAmount(income?.amount)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-200 px-2 pt-6 dark:border-slate-800">
        <p className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
          Showing page <span className="font-semibold text-slate-800 dark:text-white">{pageNumber + 1}</span>
        </p>
        <div className="flex flex-1 justify-between gap-3 sm:justify-end">
          <button
            onClick={() => setPageNumber((current) => Math.max(current - 1, 0))}
            disabled={pageNumber === 0 || isLoading || isFetching}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
          >
            <FiChevronLeft /> Previous
          </button>
          <button
            onClick={() => setPageNumber((current) => current + 1)}
            disabled={isLoading || isFetching || !data?.hasMore || !transfers.length}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
          >
            Next <FiChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
