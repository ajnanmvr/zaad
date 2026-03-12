"use client"

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";

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
      {isLoading ?
        <div className="flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
        :
        <div className="mx-auto max-w-4xl col-span-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50 sm:p-8 xl:col-span-4">
          <div className="flex justify-between items-center mb-6 px-7.5 ">
            <h4 className="text-2xl font-bold text-slate-800 dark:text-white">
              Current Liability
            </h4>
            <p>
              <span className="text-sm font-medium text-slate-500 mr-2">Net Liability:</span>
              <span className={clsx(amount > 0 ? "bg-orange-50 text-orange-600 ring-orange-500/20" : "bg-emerald-50 text-emerald-600 ring-emerald-500/20", "inline-flex items-center rounded-lg px-3 py-1 text-sm font-bold ring-1 ring-inset")}> {amount} <span className="ml-1 text-xs font-semibold">AED</span></span>
            </p>
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
    </>
  );
};

export default TransactionList;
