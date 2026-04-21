"use client";

import { useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FiArrowRight, FiPlusCircle, FiShield } from "react-icons/fi";
import { useUserContext } from "@/contexts/UserContext";
import { hasPermission } from "@/auth/permissions";

type LiabilityEntitySummary = {
  entity: string;
  income: number;
  expense: number;
  net: number;
};

type LiabilityResponse = {
  summary: {
    entities: LiabilityEntitySummary[];
    totals: {
      income: number;
      expense: number;
      net: number;
    };
  };
};

export default function LiabilityPage() {
  const router = useRouter();
  const { user } = useUserContext();
  const permissions = Array.isArray(user?.permissions) ? (user.permissions as string[]) : [];
  const canViewLiability = hasPermission(permissions, "payments.view.liability-records");
  const canCreateTransactions = hasPermission(permissions, "payments.create.transactions");

  const { data, isLoading, isError } = useQuery<LiabilityResponse>({
    queryKey: ["liability-records-page-summary"],
    enabled: canViewLiability,
    queryFn: async () => {
      const { data } = await axios.get("/api/payment/liability-records");
      return data;
    },
  });

  useEffect(() => {
    if (user && !canViewLiability) {
      router.push("/");
    }
  }, [user, canViewLiability, router]);

  if (!user || !canViewLiability) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  const entities = data?.summary?.entities || [];
  const totals = data?.summary?.totals || { income: 0, expense: 0, net: 0 };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Liability" />

      <section className="rounded-3xl border border-violet-300/60 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-6 dark:border-violet-700/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-300 bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-violet-800 dark:border-violet-600/40 dark:bg-violet-500/10 dark:text-violet-300">
              <FiShield /> Liability Summary
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Liability Records</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Income and expense position by entity.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canCreateTransactions && (
              <Link
                href="/accounts/add-record?recordKind=liability&type=income"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300"
              >
                <FiPlusCircle /> Income
              </Link>
            )}
            {canCreateTransactions && (
              <Link
                href="/accounts/add-record?recordKind=liability&type=expense"
                className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:bg-slate-900 dark:text-rose-300"
              >
                <FiPlusCircle /> Expense
              </Link>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-300/60 bg-white/80 p-4 dark:border-emerald-700/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Liability Income</p>
            <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">AED {totals.income.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-rose-300/60 bg-white/80 p-4 dark:border-rose-700/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">Liability Expense</p>
            <p className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-300">AED {totals.expense.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-slate-300/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Net</p>
            <p className={clsx("mt-1 text-2xl font-black", totals.net >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>AED {totals.net.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <h2 className="mb-4 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">Entities</h2>

        {isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading liability entities...</p>
        ) : isError ? (
          <p className="text-sm text-rose-600 dark:text-rose-300">Failed to load liability entities.</p>
        ) : entities.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No liability entities found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Income</th>
                  <th className="px-3 py-2">Expense</th>
                  <th className="px-3 py-2">Net</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entities.map((row) => (
                  <tr key={row.entity} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-3 text-sm font-bold text-slate-800 dark:text-slate-100">{row.entity}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">AED {row.income.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">AED {row.expense.toFixed(2)}</td>
                    <td className={clsx("px-3 py-3 text-sm font-black", row.net >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>AED {row.net.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/accounts/transactions?category=liability&q=${encodeURIComponent(row.entity)}`}
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
