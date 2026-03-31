"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { fetchHandovers } from "@/libs/queries";
import { TPhysicalHandover, TPaginatedResponse } from "@/types/types";
import formatDateTime from "@/utils/formatDateTime";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import clsx from "clsx";
import { PAGINATION } from "@/config/pagination";
import { FiPlus, FiRotateCcw, FiTrash2, FiFileText, FiClock, FiSearch, FiCheckCircle } from "react-icons/fi";
import AddHandoverModal from "@/components/Modals/AddHandoverModal";
import axios from "axios";
import { toast } from "react-hot-toast";

const HandoverPage = () => {
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<
    TPaginatedResponse<TPhysicalHandover>
  >({
    queryKey: ["handovers", page, search],
    queryFn: () => fetchHandovers(page, PAGINATION.LIMITS.ENTITY_LIST, search),
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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
           {/* Search Bar */}
           <div className="relative flex-grow max-w-md">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
               <FiSearch />
             </span>
             <input
               type="text"
               placeholder="Search by document name..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-slate-800 outline-none transition focus:border-primary dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200"
             />
           </div>

           <button
             onClick={() => setShowAddForm(true)}
             className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark"
           >
             <FiPlus className="text-xl" />
             Record Submission
           </button>
        </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="max-w-full overflow-x-auto">
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
                <thead>
                  <tr className="border-b border-slate-200 text-sm font-semibold tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
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
                    const isReturned = status === "returned";

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                      >
                        <td className="py-4 pl-4">
                          <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                             {entityName}
                          </span>
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
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
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
      </div>
    </>
  );
};

export default HandoverPage;
