"use client"
import { TInvoiceList } from "@/types/invoice";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import ConfirmationModal from "../Modals/ConfirmationModal";
import { useEffect, useState } from "react";
import SkeletonList from "../common/SkeletonList";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiSearch, FiPlus, FiX, FiEye, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight, FiFileText } from "react-icons/fi";

const InvoiceList = () => {
  const queryClient = useQueryClient()
  const [invoices, setInvoices] = useState<TInvoiceList[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', pageNumber, searchQuery], queryFn: async () => {
      const { data } = await axios.get(`/api/invoice?page=${pageNumber}&search=${searchQuery}`)
      return data
    }, placeholderData: keepPreviousData,
  })

  useEffect(() => {
    if (data) {
      setInvoices(data.invoices)
      setHasMore(data.hasMore)
    }
  }, [data])

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handleDelete = (id: string) => {
    setSelectedRecordId(id);
    setIsConfirmationOpen(true);
  }

  const { mutate } = useMutation({
    mutationFn: async (id: string | null) => await axios.delete(`/api/invoice/${id}`),
    onMutate: () => toast.loading("Deleting invoice..."),
    onSuccess: () => {
      toast.dismiss()
      toast.success("Invoice deleted successfully")
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: () => {
      toast.dismiss()
      toast.error("Failed to delete invoice")
    }
  })

  const confirmDelete = async () => {
    mutate(selectedRecordId)
    setIsConfirmationOpen(false);
  }

  const cancelAction = () => {
    setSelectedRecordId(null);
    setIsConfirmationOpen(false);
  }

  const handleSearch = (e: any) => {
    const value = e.target.value;
    clearTimeout((window as any).searchDebounceTimeout);
    (window as any).searchDebounceTimeout = setTimeout(() => {
      setSearchQuery(value);
      setPageNumber(0)
    }, 1000);
  }

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        message="Are you sure you want to securely delete this invoice? This action cannot be reversed."
        onConfirm={confirmDelete}
        onCancel={cancelAction}
      />

      {/* Header and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FiFileText className="text-emerald-500" /> Invoice Directory
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage all issued invoices, view details, and track amounts across your clients.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <FiSearch />
            </span>
            <input
              type="text"
              name="search"
              onChange={handleSearch}
              placeholder="Search invoices..."
              className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPageNumber(0);
                  (document.querySelector('input[name="search"]') as HTMLInputElement).value = "";
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

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50 dark:ring-slate-800/50">
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
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
                invoices.map((record, key) => (
                  <tr
                    key={key}
                    className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {record?.invoiceNo || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                        {record?.client}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {record?.purpose}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {record?.date || "N/A"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                       {(record?.amount || 0).toFixed(2)} <span className="text-xs text-emerald-500/70 ml-0.5">AED</span>
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
                          onClick={() => handleDelete(record?.id)}
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
        
        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Showing Page <span className="font-bold text-slate-800 dark:text-slate-200">{pageNumber + 1}</span>
          </p>
          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pageNumber - 1)}
              disabled={pageNumber === 0 || isLoading}
              className={clsx(
                "flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                pageNumber === 0 || isLoading
                  ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  : "bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
              )}
            >
              <FiChevronLeft /> Back
            </button>
            <button
              onClick={() => handlePageChange(pageNumber + 1)}
              disabled={isLoading || !hasMore || invoices.length === 0}
              className={clsx(
                "flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                isLoading || !hasMore || invoices.length === 0
                  ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  : "bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
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
