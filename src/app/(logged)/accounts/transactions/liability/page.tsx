"use client"

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import { FiAlertCircle, FiTrendingDown, FiTrendingUp } from "react-icons/fi";

interface Client {
  name: string;
  id: string;
  type: "company" | "employee";
}

interface TransformedData {
  client: Client;
  netAmount: number;
}


const TransactionList = () => {

  const { data, isLoading } = useQuery({
    queryKey: ["liability"], queryFn: async () => {
      const response = await axios.get(`/api/payment/liability`);
      return response.data;
    }
  })

  const amount = data?.amount ?? 0;
  const records: TransformedData[] = data?.records ?? [];


  return (
    <>
      <Breadcrumb pageName="Liability" />

      <section className="relative overflow-hidden rounded-3xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 shadow-sm dark:border-orange-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-orange-300/60 bg-orange-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-700 dark:border-orange-700/40 dark:bg-orange-900/30 dark:text-orange-300">
            <FiAlertCircle />
            Finance Risk Tracker
          </p>
          <h2 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
            Liability Overview
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Review net client liabilities and jump directly into the related entity profile for follow-up.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Net Liability</p>
              <p className={clsx(amount > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400", "mt-1 text-2xl font-black")}>
                {amount}
              </p>
            </div>
            <div className="rounded-2xl border border-orange-200/80 bg-white/80 p-4 dark:border-orange-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Direction</p>
              <p className={clsx(amount > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400", "mt-1 inline-flex items-center gap-2 text-sm font-black")}>
                {amount > 0 ? <FiTrendingDown /> : <FiTrendingUp />}
                {amount > 0 ? "Payable" : "Healthy"}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200/80 bg-white/80 p-4 dark:border-amber-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Clients</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{records.length}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6">
      {isLoading ?
        <div className="flex justify-center py-8">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
        :
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Liability By Client
            </h4>
            <span className={clsx(
              amount > 0
                ? "bg-orange-50 text-orange-600 ring-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400"
                : "bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
              "inline-flex items-center rounded-lg px-3 py-1 text-sm font-bold ring-1 ring-inset"
            )}>
              {amount} AED
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {records.map((data, key) => (
              <Link
                href={`/${data.client.type}/${data.client.id}`}
                className="group flex capitalize items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-emerald-900/50 dark:hover:bg-emerald-900/20"
                key={key}
              >
                <div className="flex items-center gap-4">
                  <div className={clsx(data.netAmount > 0 ? "bg-orange-500 shadow-orange-500/20" : "bg-emerald-500 shadow-emerald-500/20", "h-3 w-3 rounded-full shadow-sm")}></div>
                  <h5 className="font-semibold text-slate-700 transition-colors group-hover:text-emerald-700 dark:text-slate-300 dark:group-hover:text-emerald-400">
                    {data.client.name}
                  </h5>
                </div>
                <div>
                  <h5 className={clsx(data.netAmount > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400", "font-bold tracking-wide")}>
                    {data.netAmount} <span className="text-xs font-medium">AED</span>
                  </h5>
                </div>
              </Link>
            ))}
          </div>
        </div>}
        </div>
    </>
  );
};

export default TransactionList;
