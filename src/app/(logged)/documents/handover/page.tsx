"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { fetchHandovers } from "@/libs/queries";
import { TPhysicalHandover, TPaginatedResponse } from "@/types/types";
import formatDateTime from "@/utils/formatDateTime";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { PAGINATION } from "@/config/pagination";
import Link from "next/link";
import {
  FiArrowRightCircle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiPlus,
  FiRotateCcw,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import AddHandoverModal from "@/components/Modals/AddHandoverModal";
import axios from "axios";
import { toast } from "react-hot-toast";
import EntityAvatar from "@/components/common/EntityAvatar";

function getEntityHref(entityId?: string, entityType?: string) {
  if (!entityId || !entityType) {
    return null;
  }

  if (entityType === "company" || entityType === "employee" || entityType === "individual") {
    return `/${entityType}/${entityId}`;
  }

  return null;
}

const HandoverPage = () => {
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [limit, setLimit] = useState<number>(PAGINATION.LIMITS.ENTITY_LIST);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<
    TPaginatedResponse<TPhysicalHandover>
  >({
    queryKey: ["handovers", page, limit, search],
    queryFn: () => fetchHandovers(page, limit, search),
  });

  const returnMutation = useMutation({
    mutationFn: (id: string) => 
      axios.patch(`/api/documents/handover/${id}`, { action: "return" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handovers"] });
      toast.success("Document marked as returned");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      axios.delete(`/api/documents/handover/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handovers"] });
      toast.success("Record deleted");
    },
    onError: () => toast.error("Failed to delete record"),
  });

  const rows = data?.data || [];
  const pagination = data?.pagination;

  const handoverStats = useMemo(() => {
    return rows.reduce(
      (acc, item) => {
        if (item.status === "returned") {
          acc.returned += 1;
        } else {
          acc.pending += 1;
        }
        return acc;
      },
      { returned: 0, pending: 0 }
    );
  }, [rows]);

  return (
    <>
      <Breadcrumb pageName="Physical Document Handover" />

      <AddHandoverModal
        isOpen={showAddForm}
        onSuccess={() => {
          setShowAddForm(false);
          queryClient.invalidateQueries({ queryKey: ["handovers"] });
        }}
        onCancel={() => setShowAddForm(false)}
      />

      <section className="relative overflow-hidden rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-5 shadow-sm dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-8 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300">
              <FiArrowRightCircle />
              Submission Tracker
            </p>
            <h2 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              Physical Document Handover
            </h2>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <FiPlus className="text-lg" />
            Record Submission
          </button>
        </div>

        <div className="relative mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Records</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{rows.length}</p>
          </div>
          <div className="rounded-2xl border border-amber-200/80 bg-white/80 p-4 dark:border-amber-800/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pending</p>
            <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">{handoverStats.pending}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/80 bg-white/80 p-4 dark:border-emerald-800/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Returned</p>
            <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{handoverStats.returned}</p>
          </div>
          <div className="rounded-2xl border border-cyan-200/80 bg-white/80 p-4 dark:border-cyan-800/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current Page</p>
            <p className="mt-1 text-2xl font-black text-cyan-600 dark:text-cyan-400">{pagination?.page || 1}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
            <FiFileText className="text-slate-500" />
            Handover Records
          </h3>

          <div className="relative w-full max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <FiSearch />
            </span>
            <input
              type="text"
              placeholder="Search by document name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-slate-800 outline-none transition focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              title="Rows per page"
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value={10}>Show 10</option>
              <option value={20}>Show 20</option>
              <option value={30}>Show 30</option>
              <option value={50}>Show 50</option>
              <option value={100}>Show 100</option>
            </select>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
          ) : isError ? (
            <div className="py-10 text-center text-sm text-rose-600 dark:text-rose-400">
              Failed to load records. Please refresh the page.
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center gap-3">
              <FiFileText className="text-4xl text-slate-300" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No document submissions recorded yet.
              </p>
            </div>
          ) : (
            <>
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 dark:bg-slate-800/40">
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="pb-3 pl-4">Entity</th>
                    <th className="px-4 pb-3">Document Name</th>
                    <th className="px-4 pb-3">Received Date</th>
                    <th className="px-4 pb-3">Return Date</th>
                    <th className="px-4 pb-3">Status</th>
                    <th className="px-4 pb-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => {
                    const status = item.status;
                    const entityName = item.entity?.name || "Unknown";
                    const entityHref = getEntityHref(item.entity?.id, item.entity?.type);
                    const isReturned = status === "returned";

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 transition-colors last:border-0 hover:bg-cyan-50/35 dark:border-slate-800 dark:hover:bg-cyan-500/5"
                      >
                        <td className="py-4 pl-4">
                          <div className="flex items-center gap-3">
                            <EntityAvatar name={entityName} color={item.entity?.color} size="sm" />
                            <div className="flex flex-col">
                              {entityHref ? (
                                <Link
                                  href={entityHref}
                                  className="font-semibold capitalize text-primary hover:underline"
                                >
                                  {entityName}
                                </Link>
                              ) : (
                                <span className="font-semibold capitalize text-slate-800 dark:text-white">
                                  {entityName}
                                </span>
                              )}
                              {item.entity?.type && (
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                  {item.entity.type}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {item.documentName}
                            </span>
                            {item.remarks && (
                              <span className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                {item.remarks}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                             <FiClock className="text-slate-400" />
                             {formatDateTime(item.receivedAt?.toString())}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {item.returnedAt ? (
                            <div className="flex items-center gap-2">
                               <FiCheckCircle className="text-emerald-500" />
                               {formatDateTime(item.returnedAt.toString())}
                            </div>
                          ) : (
                            <span className="italic text-slate-400">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={clsx(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                              isReturned
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
                                : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
                            )}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                           <div className="flex items-center justify-center gap-2">
                              {!isReturned && (
                                <button
                                  title="Mark as Returned"
                                  onClick={() => returnMutation.mutate(item.id)}
                                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
                                >
                                  <FiRotateCcw className="text-lg" />
                                </button>
                              )}
                              <button
                                title="Delete Record"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this record?")) {
                                    deleteMutation.mutate(item.id);
                                  }
                                }}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                              >
                                <FiTrash2 className="text-lg" />
                              </button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 px-2 pb-1 pt-4 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {rows.length} of {pagination.total} records
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page <= 1}
                      className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={page >= pagination.totalPages}
                      className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default HandoverPage;
