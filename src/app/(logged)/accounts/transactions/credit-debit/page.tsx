"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FiArrowDownLeft, FiArrowUpRight, FiRefreshCw } from "react-icons/fi";

type BalanceRow = {
  id: string;
  name: string;
  balance: number;
  serviceFee?: number;
  lastActivityAt?: string | null;
};

type ProfitBalancesResponse = {
  over0balanceCompanies: BalanceRow[];
  under0balanceCompanies: BalanceRow[];
  totalProfitAllCompanies: number;
  totalToGiveCompanies: number;
  totalToGetCompanies: number;
  over0balanceEmployees: BalanceRow[];
  under0balanceEmployees: BalanceRow[];
  totalProfitAllEmployees: number;
  totalToGiveEmployees: number;
  totalToGetEmployees: number;
  over0balanceIndividuals: BalanceRow[];
  under0balanceIndividuals: BalanceRow[];
  totalProfitAllIndividuals: number;
  totalToGiveIndividuals: number;
  totalToGetIndividuals: number;
  profit: number;
  totalToGive: number;
  totalToGet: number;
};

const currency = (value: number) => `${Math.abs(Number(value || 0)).toFixed(2)} AED`;

type EntityKind = "company" | "employee" | "individual";

type SectionConfig = {
  key: EntityKind;
  label: string;
  hrefPrefix: string;
};

const sections: SectionConfig[] = [
  { key: "company", label: "Companies", hrefPrefix: "/company" },
  { key: "employee", label: "Employees", hrefPrefix: "/employee" },
  { key: "individual", label: "Individuals", hrefPrefix: "/individual" },
];

function sectionRows(data: ProfitBalancesResponse, kind: EntityKind, tab: "credit" | "debit") {
  if (kind === "company") {
    return tab === "credit" ? data.under0balanceCompanies : data.over0balanceCompanies;
  }
  if (kind === "employee") {
    return tab === "credit" ? data.under0balanceEmployees : data.over0balanceEmployees;
  }
  return tab === "credit" ? data.under0balanceIndividuals : data.over0balanceIndividuals;
}

function sectionTotal(data: ProfitBalancesResponse, kind: EntityKind, tab: "credit" | "debit") {
  if (kind === "company") {
    return tab === "credit" ? data.totalToGetCompanies : data.totalToGiveCompanies;
  }
  if (kind === "employee") {
    return tab === "credit" ? data.totalToGetEmployees : data.totalToGiveEmployees;
  }
  return tab === "credit" ? data.totalToGetIndividuals : data.totalToGiveIndividuals;
}

export default function CreditDebitPage() {
  const [tab, setTab] = useState<"credit" | "debit">("credit");

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<ProfitBalancesResponse>({
    queryKey: ["credit-debit-balances"],
    queryFn: async () => {
      const response = await axios.get("/api/payment/profits");
      return response.data;
    },
  });

  const totals = useMemo(() => {
    const totalCredit = Math.abs(Number(data?.totalToGet || 0));
    const totalDebit = Number(data?.totalToGive || 0);
    return {
      totalCredit,
      totalDebit,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Credit / Debit" />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Credit / Debit</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Entity-wise balances from profits route.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <FiRefreshCw className={clsx(isFetching && "animate-spin")} />
            Refresh
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-rose-300/60 bg-rose-50/60 p-4 dark:border-rose-700/40 dark:bg-rose-900/10">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">Total Credit</p>
            <p className="mt-1 inline-flex items-center gap-2 text-2xl font-black text-rose-700 dark:text-rose-300">
              <FiArrowDownLeft /> {currency(totals.totalCredit)}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-300/60 bg-emerald-50/60 p-4 dark:border-emerald-700/40 dark:bg-emerald-900/10">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Total Debit</p>
            <p className="mt-1 inline-flex items-center gap-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">
              <FiArrowUpRight /> {currency(totals.totalDebit)}
            </p>
          </div>
        </div>

        <div className="mt-5 inline-flex rounded-xl border border-slate-300 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setTab("credit")}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-bold transition",
              tab === "credit"
                ? "bg-white text-rose-700 shadow-sm dark:bg-slate-900 dark:text-rose-300"
                : "text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100",
            )}
          >
            Credit List
          </button>
          <button
            type="button"
            onClick={() => setTab("debit")}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-bold transition",
              tab === "debit"
                ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300"
                : "text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100",
            )}
          >
            Debit List
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Loading balances...
        </div>
      ) : isError || !data ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-300">
          Failed to load credit/debit balances.
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => {
            const rows = sectionRows(data, section.key, tab);
            const total = sectionTotal(data, section.key, tab);

            return (
              <section
                key={section.key}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/60"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    {section.label}
                  </h2>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Total: {currency(total)}
                  </span>
                </div>

                {rows.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">No records in this list.</p>
                ) : (
                  <div className="max-w-full overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Balance</th>
                          <th className="px-4 py-3">Last Activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-slate-100 text-sm text-slate-700 last:border-0 dark:border-slate-800 dark:text-slate-200"
                          >
                            <td className="px-4 py-3">
                              <Link
                                href={`${section.hrefPrefix}/${row.id}`}
                                className="font-semibold transition hover:text-emerald-600 dark:hover:text-emerald-400"
                              >
                                {row.name}
                              </Link>
                            </td>
                            <td className="px-4 py-3 font-bold">
                              {currency(row.balance)}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                              {row.lastActivityAt
                                ? new Date(row.lastActivityAt).toLocaleDateString()
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
