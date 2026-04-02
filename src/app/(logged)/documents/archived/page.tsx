"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import EntityAvatar from "@/components/common/EntityAvatar";
import { PAGINATION } from "@/config/pagination";
import { fetchArchivedDocuments } from "@/libs/queries";
import { TExpiryDocumentItem, TPaginatedResponse } from "@/types/types";
import formatDate from "@/utils/formatDate";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FiArchive, FiArrowLeft, FiCornerUpLeft, FiFileText } from "react-icons/fi";
import { toast } from "react-hot-toast";

function getEntityHref(entityId?: string, entityType?: string) {
  if (!entityId || !entityType) {
    return null;
  }

  if (entityType === "company" || entityType === "employee" || entityType === "individual") {
    return `/${entityType}/${entityId}`;
  }

  return null;
}

const ArchivedDocumentsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [limit, setLimit] = useState<number>(PAGINATION.LIMITS.EXPIRY_DOCUMENTS);
  const [unarchivingId, setUnarchivingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<TPaginatedResponse<TExpiryDocumentItem>>({
    queryKey: ["archived-documents", page, limit],
    queryFn: () => fetchArchivedDocuments(page, limit),
  });

  const rows = useMemo(() => data?.data || [], [data]);
  const pagination = data?.pagination;

  const unarchiveDocument = async (itemId: string) => {
    try {
      setUnarchivingId(itemId);
      await axios.put(`/api/documents/unarchive/${itemId}`);
      toast.success("Document moved back to expiry list");
      await queryClient.invalidateQueries({ queryKey: ["archived-documents"] });
      await queryClient.invalidateQueries({ queryKey: ["expiry-documents"] });
    } catch (error) {
      toast.error("Failed to unarchive document");
      console.error(error);
    } finally {
      setUnarchivingId(null);
    }
  };

  return (
    <>
      <Breadcrumb pageName="Archived Documents" />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <FiArchive />
              Archive
            </p>
            <h2 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              Archived Documents
            </h2>
          </div>

          <Link
            href="/documents/expiry"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FiArrowLeft />
            Back To Expiry List
          </Link>
        </div>

        <div className="mb-4 flex items-center justify-end">
          <select
            title="Rows per page"
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(PAGINATION.DEFAULT_PAGE);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value={10}>Show 10</option>
            <option value={20}>Show 20</option>
            <option value={30}>Show 30</option>
            <option value={50}>Show 50</option>
            <option value={100}>Show 100</option>
          </select>
        </div>

        <div className="max-w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
          ) : isError ? (
            <div className="py-10 text-center text-sm text-rose-600 dark:text-rose-400">
              Failed to load archived documents. Please refresh the page.
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-600 dark:text-slate-400">
              No archived documents found.
            </div>
          ) : (
            <>
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 dark:bg-slate-800/40">
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="min-w-[240px] pb-3 pl-4">Document</th>
                    <th className="min-w-[220px] px-4 pb-3">Entity</th>
                    <th className="min-w-[150px] px-4 pb-3">Expiry Date</th>
                    <th className="min-w-[150px] px-4 pb-3">Archived On</th>
                    <th className="min-w-[260px] px-4 pb-3">Archive Notes</th>
                    <th className="min-w-[140px] px-4 pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => {
                    const entityName = item.entity?.name || "Unknown";
                    const entityType = item.entity?.entityType || "unknown";
                    const entityId = item.entity?.id;
                    const entityHref = getEntityHref(entityId, entityType);

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                      >
                        <td className="py-4 pl-4">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300">
                              <FiFileText />
                            </span>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {item.name || "Unnamed document"}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">Archived</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <EntityAvatar name={entityName} color={item.entity?.color} size="sm" />
                            <div className="flex flex-col">
                              {entityHref ? (
                                <Link
                                  href={entityHref}
                                  className="text-sm font-semibold capitalize text-primary hover:underline"
                                >
                                  {entityName}
                                </Link>
                              ) : (
                                <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
                                  {entityName}
                                </span>
                              )}
                              <span className="text-xs uppercase text-slate-500 dark:text-slate-400">
                                {entityType}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {formatDate(item.expiryDate || null)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {formatDate(item.archivedAt || null)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                          <span className={clsx(!item.archiveNotes && "text-slate-400")}>{item.archiveNotes || "No notes provided"}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => unarchiveDocument(item.id)}
                              disabled={unarchivingId === item.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                            >
                              <FiCornerUpLeft />
                              {unarchivingId === item.id ? "Unarchiving..." : "Unarchive"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4 flex items-center justify-between px-2 pb-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {pagination?.total || 0} archived documents. Page {pagination?.page || 1} of {pagination?.totalPages || 1}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={!pagination || pagination.page <= 1}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={!pagination || pagination.page >= pagination.totalPages}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default ArchivedDocumentsPage;
