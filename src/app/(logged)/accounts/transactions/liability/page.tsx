"use client"

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import { FiAlertCircle, FiClock, FiTrendingDown, FiTrendingUp } from "react-icons/fi";

interface Client {
  name: string;
  id: string;
  type: "company" | "employee" | "individual";
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
  const payableCount = records.filter((record) => record.netAmount > 0).length;
  const healthyCount = records.filter((record) => record.netAmount <= 0).length;
  const individualCount = records.filter((record) => record.client.type === "individual").length;
  const companyCount = records.filter((record) => record.client.type === "company").length;
  const employeeCount = records.filter((record) => record.client.type === "employee").length;


  return (
    <>
      <Breadcrumb pageName="Liability" />

      <section className="relative overflow-hidden rounded-3xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 shadow-sm dark:border-orange-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-orange-300/60 bg-orange-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-700 dark:border-orange-700/40 dark:bg-orange-900/30 dark:text-orange-300">
              <FiAlertCircle />
              Finance Risk Tracker
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Liability Overview
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Review net client liabilities and jump directly into the related entity profile for follow-up.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
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
            <div className="rounded-2xl border border-cyan-200/80 bg-white/80 p-4 dark:border-cyan-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Updated</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-cyan-600 dark:text-cyan-400">
                <FiClock />
                Live
              </p>
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
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-8">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h4 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Liability By Client
              </h4>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {payableCount} payable, {healthyCount} healthy, across {companyCount} companies, {employeeCount} employees, and {individualCount} individuals.
              </p>
            </div>
            <span className={clsx(
              amount > 0
                ? "bg-orange-50 text-orange-600 ring-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400"
                : "bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
              "inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold ring-1 ring-inset"
            )}>
              {amount} AED
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full border-separate border-spacing-0 text-left">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-900/95">
                  <tr className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">Client</th>
                    <th className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">Type</th>
                    <th className="border-b border-slate-200 px-5 py-4 text-right dark:border-slate-800">Net Amount</th>
                    <th className="border-b border-slate-200 px-5 py-4 text-center dark:border-slate-800">Direction</th>
                    <th className="border-b border-slate-200 px-5 py-4 text-right dark:border-slate-800">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((data, key) => {
                    const isPayable = data.netAmount > 0;

                    return (
                      <tr
                        key={key}
                        className="group border-b border-slate-100 bg-white transition-colors last:border-0 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className={clsx(isPayable ? "bg-orange-500 shadow-orange-500/20" : "bg-emerald-500 shadow-emerald-500/20", "h-3 w-3 rounded-full shadow-sm")} />
                            <div>
                              <h5 className="font-semibold capitalize text-slate-800 transition-colors group-hover:text-emerald-700 dark:text-slate-200 dark:group-hover:text-emerald-400">
                                {data.client.name}
                              </h5>
                              <p className="text-xs text-slate-500 dark:text-slate-500">
                                {data.client.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <span className={clsx(
                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                            data.client.type === "company" && "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
                            data.client.type === "employee" && "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
                            data.client.type === "individual" && "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                          )}>
                            {data.client.type}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right align-middle">
                          <span className={clsx(
                            "text-sm font-black sm:text-base",
                            isPayable ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"
                          )}>
                            {Math.abs(data.netAmount)} AED
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center align-middle">
                          <span className={clsx(
                            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                            isPayable
                              ? "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          )}>
                            {isPayable ? <FiTrendingDown /> : <FiTrendingUp />}
                            {isPayable ? "Payable" : "Healthy"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right align-middle">
                          <Link
                            href={`/${data.client.type}/${data.client.id}`}
                            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-900/50 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                          >
                            Open Profile
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>}
        </div>
    </>
  );
};

export default TransactionList;
