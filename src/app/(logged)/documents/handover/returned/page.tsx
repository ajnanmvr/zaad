"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { fetchHandovers } from "@/libs/queries";
import { TPhysicalHandover, TPaginatedResponse } from "@/types/types";
import formatDateTime from "@/utils/formatDateTime";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import clsx from "clsx";
import { PAGINATION } from "@/config/pagination";
import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiClock, FiFileText, FiSearch, FiTrash2 } from "react-icons/fi";
import axios from "axios";
import { toast } from "react-hot-toast";
import EntityAvatar from "@/components/common/EntityAvatar";
import UsernameWithIcon from "@/components/common/UsernameWithIcon";

function getEntityHref(entityId?: string, entityType?: string) {
  if (!entityId || !entityType) {
    return null;
  }

  if (entityType === "company" || entityType === "employee" || entityType === "individual") {
    return `/${entityType}/${entityId}`;
  }

  return null;
}

const ReturnedHandoverPage = () => {
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [limit, setLimit] = useState<number>(PAGINATION.LIMITS.ENTITY_LIST);
  const [search, setSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<
    TPaginatedResponse<TPhysicalHandover>
  >({
    queryKey: ["handovers", "returned", page, limit, search],
    queryFn: () => fetchHandovers(page, limit, search, undefined, "returned"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      axios.delete(`/api/documents/handover/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handovers"] });
      toast.success("Record deleted");
      setDeleteConfirmId(null);
    },
    onError: () => toast.error("Failed to delete record"),
  });

  const rows = data?.data || [];
  const pagination = data?.pagination;

  return (
    <>
      <Breadcrumb pageName="Returned Physical Documents" />

      <section className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-5 shadow-sm dark:border-emerald-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-8 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-100/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-300">
              <FiCheckCircle />
              Returned Tracker
            </p>
            <h2 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              Returned Document List
            </h2>
          </div>

          <Link
            href="/documents/handover"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FiArrowLeft className="text-base" />
            Pending List
          </Link>
        </div>

        <div className="relative mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Returned Records</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{rows.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/80 bg-white/80 p-4 dark:border-emerald-800/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</p>
            <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">Returned</p>
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
            Returned Handover Records
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
                No returned records found.
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
                    <th className="px-4 pb-3">Received By</th>
                    <th className="px-4 pb-3">Return Date</th>
                    <th className="px-4 pb-3">Returned By</th>
                    <th className="px-4 pb-3">Receive Note</th>
                    <th className="px-4 pb-3">Return Note</th>
                    <th className="px-4 pb-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => {
                    const entityName = item.entity?.name || "Unknown";
                    const entityHref = getEntityHref(item.entity?.id, item.entity?.type);

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
                        <td className="px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                          {item.documentName}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <FiClock className="text-slate-400" />
                            {formatDateTime(item.receivedAt?.toString())}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                          <UsernameWithIcon
                            username={item.receivedBy?.username}
                            fullname={item.receivedBy?.fullname}
                          />
                        </td>
                        <td className="px-4 py-4 text-sm text-emerald-700 dark:text-emerald-300">
                          {item.returnedAt ? formatDateTime(item.returnedAt.toString()) : "-"}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                          <UsernameWithIcon
                            username={item.returnedBy?.username}
                            fullname={item.returnedBy?.fullname}
                          />
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {item.receiveNote || item.remarks || "-"}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {item.returnNote || "-"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              title={deleteConfirmId === item.id ? "Click again to permanently delete" : "Delete Record"}
                              onClick={() => {
                                if (deleteConfirmId === item.id) {
                                  deleteMutation.mutate(item.id);
                                } else {
                                  setDeleteConfirmId(item.id);
                                  toast.error("Click delete again to confirm");
                                }
                              }}
                              className={clsx(
                                "rounded-lg p-2 transition-colors",
                                deleteConfirmId === item.id
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                                  : "text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10",
                              )}
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

export default ReturnedHandoverPage;
