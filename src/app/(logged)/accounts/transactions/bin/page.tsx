"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { TRecordList } from "@/types/records";
import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { formatDateTime } from "@/utils/dateUtils";
import { FiArrowLeft, FiEye, FiRefreshCw, FiRotateCcw, FiSearch, FiTrash2 } from "react-icons/fi";
import UsernameWithIcon from "@/components/common/UsernameWithIcon";

type TBinResponse = {
  records: TRecordList[];
  hasMore: boolean;
  count: number;
};

const TransactionBinPage = () => {
  const queryClient = useQueryClient();
  const [pageNumber, setPageNumber] = useState(0);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery<TBinResponse>({
    queryKey: ["payment-bin", pageNumber, search],
    queryFn: async () => {
      const { data } = await axios.get(`/api/payment/bin?page=${pageNumber}&search=${encodeURIComponent(search)}`);
      return data;
    },
  });

  const recoverMutation = useMutation({
    mutationFn: (id: string) => axios.patch(`/api/payment/${id}`, { action: "recover" }),
    onSuccess: () => {
      toast.success("Record recovered successfully");
      queryClient.invalidateQueries({ queryKey: ["payment-bin"] });
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["profits"] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || "Failed to recover record";
      toast.error(message);
    },
  });

  const records = data?.records || [];

  return (
    <>
      <Breadcrumb pageName="Transactions Bin" />

      <section className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-sm dark:border-amber-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-14 h-52 w-52 rounded-full bg-orange-300/20 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-300">
              <FiTrash2 />
              Admin Recovery
            </p>
            <h2 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              Deleted Transactions Bin
            </h2>
          </div>

          <Link
            href="/accounts/transactions"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FiArrowLeft className="text-base" />
            Back to Transactions
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 sm:max-w-md">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPageNumber(0);
              }}
              placeholder="Search deleted transactions..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-amber-500 dark:focus:ring-amber-500/20"
            />
          </div>

          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["payment-bin"] })}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        <div className="max-w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-amber-500 border-t-transparent"></div>
            </div>
          ) : isError ? (
            <div className="py-10 text-center text-sm text-rose-600 dark:text-rose-400">
              Failed to load deleted records.
            </div>
          ) : records.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-600 dark:text-slate-400">
              No deleted transactions in bin.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40">
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="pb-3 pl-4">Record ID</th>
                  <th className="px-4 pb-3">Client</th>
                  <th className="px-4 pb-3">Particular</th>
                  <th className="px-4 pb-3">Amount</th>
                  <th className="px-4 pb-3">Deleted At</th>
                  <th className="px-4 pb-3">Deleted By</th>
                  <th className="px-4 pb-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="py-4 pl-4 text-sm font-semibold uppercase text-slate-700 dark:text-slate-200">
                      {(record.suffix || "") + (record.number || "")}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                      {record.client?.name || "Unknown"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                      {record.particular || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {record.amount} AED
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {record.deletedAt ? formatDateTime(record.deletedAt) : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <UsernameWithIcon
                        username={record.deletedBy}
                        fullname={record.deletedByFullname}
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/accounts/transactions/details/${record.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <FiEye /> Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => recoverMutation.mutate(record.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                          disabled={recoverMutation.isPending}
                        >
                          <FiRotateCcw /> Recover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing page <span className="font-semibold text-slate-800 dark:text-slate-100">{pageNumber + 1}</span>
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 0))}
              disabled={pageNumber === 0 || isLoading}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPageNumber((prev) => prev + 1)}
              disabled={isLoading || !data?.hasMore}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default TransactionBinPage;
