"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { fetchExpiryDocuments } from "@/libs/queries";
import { TExpiryDocumentItem, TPaginatedResponse } from "@/types/types";
import calculateStatus from "@/utils/calculateStatus";
import formatDate from "@/utils/formatDate";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import clsx from "clsx";
import { PAGINATION } from "@/config/pagination";

const ExpiryDocumentsPage = () => {
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);

  const { data, isLoading, isError } = useQuery<
    TPaginatedResponse<TExpiryDocumentItem>
  >({
    queryKey: ["expiry-documents", page],
    queryFn: () => fetchExpiryDocuments(page, PAGINATION.LIMITS.EXPIRY_DOCUMENTS),
  });

  const rows = data?.data || [];
  const pagination = data?.pagination;

  return (
    <>
      <Breadcrumb pageName="Expiry Documents" />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="max-w-full overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
          ) : isError ? (
            <div className="py-10 text-center text-sm text-rose-600 dark:text-rose-400">
              Failed to load expiry documents. Please refresh the page.
            </div>
          ) : (
            <>
              <table className="mt-2 w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-sm font-semibold tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="min-w-[220px] pb-3 pl-4">Entity</th>
                    <th className="min-w-[220px] px-4 pb-3">Document</th>
                    <th className="min-w-[150px] px-4 pb-3">Expiry Date</th>
                    <th className="min-w-[100px] px-4 pb-3">Days Left</th>
                    <th className="min-w-[120px] px-4 pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => {
                    const status =
                      item.status || calculateStatus(item.expiryDate || "");
                    const daysLeft = item.daysLeft;
                    const entityName = item.entity?.name || "Unknown";
                    const entityType = item.entity?.entityType || "unknown";
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                      >
                        <td className="py-4 pl-4">
                          <div className="flex flex-col">
                            <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                              {entityName}
                            </span>
                            <span className="text-xs uppercase text-slate-500 dark:text-slate-400">
                              {entityType}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {item.name || "---"}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {formatDate(item.expiryDate || null)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={clsx(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                              daysLeft === null
                                ? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-400/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20"
                                : daysLeft < 0
                                  ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20"
                                  : daysLeft <= 30
                                    ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
                                    : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
                            )}
                          >
                            {daysLeft === null ? "---" : daysLeft}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={clsx(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                              status === "valid"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
                                : status === "expired"
                                  ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20"
                                  : status === "renewal"
                                    ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
                                    : "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20",
                            )}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {pagination?.total || 0} documents. Page{" "}
                  {pagination?.page || 1} of {pagination?.totalPages || 1}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={!pagination || pagination.page <= 1}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={
                      !pagination || pagination.page >= pagination.totalPages
                    }
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ExpiryDocumentsPage;
