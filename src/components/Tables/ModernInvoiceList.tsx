"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  Download,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
} from "lucide-react";
import { listInvoicesAction, deleteInvoiceAction } from "@/actions/invoice";
import { TInvoiceList } from "@/types/invoice";
import { DataTable, Column } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { StatsCard } from "../ui/StatsCard";
import { Modal, ModalFooter } from "../ui/Modal";
import Link from "next/link";

export default function ModernInvoiceList() {
  const queryClient = useQueryClient();
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<string | null>(null);
  const [pageNumber, setPageNumber] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPageNumber(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", pageNumber, debouncedSearch],
    queryFn: async () => {
      return await listInvoicesAction(debouncedSearch, pageNumber);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInvoiceAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setDeleteModalOpen(false);
      setSelectedInvoiceId(null);
      if (window.toast) {
        window.toast.success("Invoice deleted successfully");
      }
    },
    onError: () => {
      if (window.toast) {
        window.toast.error("Failed to delete invoice");
      }
    },
  });

  const handleDelete = (id: string) => {
    setSelectedInvoiceId(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedInvoiceId) {
      deleteMutation.mutate(selectedInvoiceId);
    }
  };

  const columns: Column<TInvoiceList>[] = [
    {
      key: "invoiceNo",
      title: "Invoice #",
      sortable: true,
      width: "120px",
      render: (value) => (
        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
          #{value}
        </span>
      ),
    },
    {
      key: "date",
      title: "Date",
      sortable: true,
      width: "130px",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm">
            {new Date(value).toLocaleDateString("en-GB")}
          </span>
        </div>
      ),
    },
    {
      key: "client",
      title: "Client",
      sortable: true,
      render: (value) => (
        <span className="font-medium capitalize">{typeof value === "string" ? value : value?.name || "—"}</span>
      ),
    },
    {
      key: "purpose",
      title: "Purpose",
      render: (value) => (
        <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
          {value || "—"}
        </span>
      ),
    },
    {
      key: "amount",
      title: "Total Amount",
      sortable: true,
      align: "right",
      render: (value) => (
        <div className="flex items-center justify-end gap-2">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold">{parseFloat(value).toFixed(2)} AED</span>
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/accounts/invoice/${row.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
            className="text-red hover:text-red hover:bg-red/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Calculate summary stats
  const totalInvoices = data?.invoices?.length || 0;
  const totalAmount = data?.invoices?.reduce((sum, inv) => sum + parseFloat(String(inv.amount)), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-boxdark-2">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark backdrop-blur-sm bg-white/80 dark:bg-boxdark/80">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">Invoices</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage all client invoices
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Download className="h-5 w-5" />
            </Button>
            <Link href="/accounts/invoice/add">
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                New Invoice
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatsCard
            title="Total Invoices"
            value={totalInvoices.toString()}
            icon={<FileText className="h-6 w-6" />}
            loading={isLoading}
          />
          <StatsCard
            title="Total Amount"
            value={`${totalAmount.toFixed(2)} AED`}
            icon={<DollarSign className="h-6 w-6" />}
            variant="success"
            loading={isLoading}
          />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm p-6">
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by client name or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>

          <DataTable
            data={data?.invoices || []}
            columns={columns}
            loading={isLoading}
            emptyMessage="No invoices found"
          />

          {/* Pagination */}
          {data && (data.hasMore || pageNumber > 0) && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-stroke dark:border-strokedark">
              <Button
                variant="outline"
                onClick={() => setPageNumber(Math.max(0, pageNumber - 1))}
                disabled={pageNumber === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pageNumber + 1}
              </span>
              <Button
                variant="outline"
                onClick={() => setPageNumber(pageNumber + 1)}
                disabled={!data.hasMore}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <Modal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Invoice"
          description="Are you sure you want to delete this invoice? This action cannot be undone."
        >
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
