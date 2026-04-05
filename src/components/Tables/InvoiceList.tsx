"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiChevronLeft, FiChevronRight, FiEdit2, FiEye, FiFileText, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { TInvoiceList } from "@/types/invoice";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import toast from "react-hot-toast";

import ConfirmationModal from "../Modals/ConfirmationModal";
import SkeletonList from "../common/SkeletonList";
import EntityAvatar from "../common/EntityAvatar";

const InvoiceList = ({ entityId, embedded = false }: { entityId?: string; embedded?: boolean } = {}) => {
  const queryClient = useQueryClient();
  const [invoices, setInvoices] = useState<TInvoiceList[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", pageNumber, searchQuery, entityId],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(pageNumber), search: searchQuery || "" });
      if (entityId) params.set("entityId", entityId);
      const response = await axios.get(`/api/invoice?${params.toString()}`);
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (data) {
      setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
      setHasMore(Boolean(data.hasMore));
    }
  }, [data]);

  const totalAmount = useMemo(
    () => invoices.reduce((sum, invoice) => sum + Number(invoice?.amount || 0), 0),
    [invoices],
  );

  const { mutate } = useMutation({
    mutationFn: async (id: string | null) => axios.delete(`/api/invoice/${id}`),
    onMutate: () => toast.loading("Deleting invoice..."),
    onSuccess: () => {
      toast.dismiss();
      toast.success("Invoice deleted successfully");
      setSelectedRecordId(null);
      setIsConfirmationOpen(false);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => {
      toast.dismiss();
      toast.error("Failed to delete invoice");
    },
  });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchInput(value);
    clearTimeout((window as any).searchDebounceTimeout);
    (window as any).searchDebounceTimeout = setTimeout(() => {
      setSearchQuery(value);
      setPageNumber(0);
    }, 1000);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none">
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        message="Are you sure you want to securely delete this invoice? This action cannot be reversed."
        onConfirm={() => mutate(selectedRecordId)}
        onCancel={() => {
          setSelectedRecordId(null);
          setIsConfirmationOpen(false);
        }}
      />

      {!embedded && (
        <div className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-violet-200/40 blur-2xl dark:bg-violet-500/10" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-cyan-200/50 blur-xl dark:bg-cyan-500/10" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-base font-black tracking-tight text-slate-800 dark:text-slate-200">Invoice Directory</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Manage issued invoices, view details, and track billing totals.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  {invoices.length} Visible
                </div>
                <div className="inline-flex items-center rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 dark:border-violet-700/40 dark:bg-violet-900/30 dark:text-violet-300">
                  {totalAmount.toFixed(2)} AED
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 p-3 dark:border-slate-700 dark:bg-slate-900/85">
              <div className="relative min-w-[240px] flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiSearch />
                </span>
                <input
                  type="text"
                  name="search"
                  value={searchInput}
                  onChange={handleSearch}
                  placeholder="Search invoices..."
                  className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setSearchQuery("");
                      setPageNumber(0);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                  >
                    <FiX />
                  </button>
                )}
              </div>

              <Link
                href="/accounts/invoice/new"
                className="group flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 hover:shadow-emerald-500/30"
              >
                <FiPlus className="text-lg transition-transform group-hover:rotate-90" />
                <span className="hidden sm:inline">Create Invoice</span>
                <span className="sm:hidden">Create</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 sm:p-7">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-800/20">
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Invoice No</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Client</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Purpose</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <SkeletonList />
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
                          <FiFileText className="text-2xl text-slate-400" />
                        </div>
                        <p className="text-base font-medium text-slate-700 dark:text-slate-300">No invoices found</p>
                        <p className="text-sm">Try adjusting your search criteria or create a new invoice.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((record) => (
                    <tr key={record.id} className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                          {record?.invoiceNo || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <EntityAvatar
                            name={record?.entityName || record?.client || "Unknown"}
                            color={record?.entityColor || undefined}
                            size="sm"
                          />
                          <div className="font-semibold capitalize text-slate-800 dark:text-slate-200">{record?.client}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{record?.purpose}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{record?.date || "N/A"}</td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {(record?.amount || 0).toFixed(2)} <span className="ml-0.5 text-xs text-emerald-500/70">AED</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-100 transition-opacity">
                          <Link
                            href={`/accounts/invoice/${record?.id}`}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                            title="View Details"
                          >
                            <FiEye className="text-lg" />
                          </Link>
                          <Link
                            href={`/accounts/invoice/${record?.id}/edit`}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                            title="Edit Invoice"
                          >
                            <FiEdit2 className="text-lg" />
                          </Link>
                          <button
                            title="Delete Invoice"
                            onClick={() => {
                              setSelectedRecordId(record?.id);
                              setIsConfirmationOpen(true);
                            }}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-200 px-2 pt-6 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Showing Page <span className="font-bold text-slate-800 dark:text-slate-200">{pageNumber + 1}</span>
          </p>
          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 0))}
              disabled={pageNumber === 0 || isLoading}
              className={clsx(
                "flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                pageNumber === 0 || isLoading
                  ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  : "bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700",
              )}
            >
              <FiChevronLeft /> Back
            </button>
            <button
              onClick={() => setPageNumber((prev) => prev + 1)}
              disabled={isLoading || !hasMore || invoices.length === 0}
              className={clsx(
                "flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                isLoading || !hasMore || invoices.length === 0
                  ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  : "bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700",
              )}
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;
