"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Filter,
  Plus,
  MoreVertical,
  Trash2,
  Eye,
  Download,
} from "lucide-react";
import {
  listRecordsAction,
  deleteRecordAction,
} from "@/actions/payment";
import { TRecordList } from "@/types/records";
import { DataTable, Column } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { StatsCard } from "../ui/StatsCard";
import { Modal, ModalFooter } from "../ui/Modal";
import { Select } from "../ui/Select";
import Link from "next/link";

interface FilterState {
  t: string;
  m: string;
}

export default function ModernTransactionList() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = React.useState<FilterState>({ t: "", m: "" });
  const [filterDummy, setFilterDummy] = React.useState<FilterState>({ t: "", m: "" });
  const [isFilterOpen, setFilterOpen] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [selectedRecordId, setSelectedRecordId] = React.useState<string | null>(null);
  const [pageNumber, setPageNumber] = React.useState(0);

  const { data: paymentData, isLoading } = useQuery({
    queryKey: ["payment", pageNumber, filter.t, filter.m],
    queryFn: async () => {
      return await listRecordsAction(filter.m || null, filter.t || null, pageNumber);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRecordAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      setDeleteModalOpen(false);
      setSelectedRecordId(null);
      if (window.toast) {
        window.toast.success("Transaction deleted successfully");
      }
    },
    onError: () => {
      if (window.toast) {
        window.toast.error("Failed to delete transaction");
      }
    },
  });

  const handleDelete = (id: string) => {
    setSelectedRecordId(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRecordId) {
      deleteMutation.mutate(selectedRecordId);
    }
  };

  const applyFilter = () => {
    setFilter(filterDummy);
    setFilterOpen(false);
    setPageNumber(0);
  };

  const clearFilter = () => {
    setFilter({ t: "", m: "" });
    setFilterDummy({ t: "", m: "" });
    setFilterOpen(false);
    setPageNumber(0);
  };

  const columns: Column<TRecordList>[] = [
    {
      key: "date",
      title: "Date",
      sortable: true,
      width: "150px",
      render: (value) => (
        <span className="text-sm font-medium">
          {new Date(value).toLocaleDateString("en-GB")}
        </span>
      ),
    },
    {
      key: "method",
      title: "Method",
      sortable: true,
      render: (value) => {
        const variants: Record<string, any> = {
          cash: "default",
          bank: "info",
          tasdeed: "warning",
          liability: "secondary",
        };
        return (
          <Badge variant={variants[value] || "default"}>
            {value}
          </Badge>
        );
      },
    },
    {
      key: "type",
      title: "Type",
      sortable: true,
      render: (value) => (
        <Badge variant={value === "income" ? "success" : "danger"}>
          {value}
        </Badge>
      ),
    },
    {
      key: "amount",
      title: "Amount",
      sortable: true,
      align: "right",
      render: (value, row) => (
        <div className="flex items-center justify-end gap-2">
          {row.type === "income" ? (
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red" />
          )}
          <span className="font-semibold">{parseFloat(value).toFixed(2)} AED</span>
        </div>
      ),
    },
    {
      key: "serviceFee",
      title: "Fee",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {parseFloat(value || 0).toFixed(2)} AED
        </span>
      ),
    },
    {
      key: "description",
      title: "Description",
      render: (value) => (
        <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
          {value || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
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

  const getFilterLabel = () => {
    const parts = [];
    if (filter.t) parts.push(`Type: ${filter.t}`);
    if (filter.m) parts.push(`Method: ${filter.m}`);
    return parts.length > 0 ? parts.join(", ") : "All Transactions";
  };

  // Calculate summary stats
  const totalIncome = paymentData?.records?.filter(r => r.type === "income").reduce((sum, r) => sum + parseFloat(r.amount), 0) || 0;
  const totalExpense = paymentData?.records?.filter(r => r.type === "expense").reduce((sum, r) => sum + parseFloat(r.amount) + parseFloat(r.serviceFee || "0"), 0) || 0;
  const netAmount = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-boxdark-2">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark backdrop-blur-sm bg-white/80 dark:bg-boxdark/80">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">Transactions</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage all financial transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={() => setFilterOpen(true)} className="gap-2">
              <Filter className="h-4 w-4" />
              {getFilterLabel()}
            </Button>
            <Link href="/accounts/transactions/add">
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                New Transaction
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Income"
            value={`${totalIncome.toFixed(2)} AED`}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="success"
            loading={isLoading}
          />
          <StatsCard
            title="Total Expense"
            value={`${totalExpense.toFixed(2)} AED`}
            icon={<TrendingDown className="h-6 w-6" />}
            variant="danger"
            loading={isLoading}
          />
          <StatsCard
            title="Net Amount"
            value={`${netAmount.toFixed(2)} AED`}
            icon={<FileText className="h-6 w-6" />}
            variant={netAmount >= 0 ? "success" : "danger"}
            loading={isLoading}
          />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm p-6">
          <DataTable
            data={paymentData?.records || []}
            columns={columns}
            loading={isLoading}
            searchable
            searchPlaceholder="Search transactions..."
            emptyMessage="No transactions found"
          />

          {/* Pagination */}
          {paymentData && (paymentData.hasMore || pageNumber > 0) && (
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
                disabled={!paymentData.hasMore}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <Modal
          open={isFilterOpen}
          onClose={() => setFilterOpen(false)}
          title="Filter Transactions"
        >
          <div className="space-y-4">
            <Select
              label="Transaction Type"
              value={filterDummy.t}
              onChange={(e) => setFilterDummy({ ...filterDummy, t: e.target.value })}
              options={[
                { value: "", label: "All Types" },
                { value: "income", label: "Income" },
                { value: "expense", label: "Expense" },
              ]}
            />

            <Select
              label="Payment Method"
              value={filterDummy.m}
              onChange={(e) => setFilterDummy({ ...filterDummy, m: e.target.value })}
              options={[
                { value: "", label: "All Methods" },
                { value: "cash", label: "Cash" },
                { value: "bank", label: "Bank" },
                { value: "tasdeed", label: "Tasdeed" },
                { value: "liability", label: "Liability" },
              ]}
            />

            <ModalFooter>
              <Button variant="secondary" onClick={clearFilter}>
                Clear
              </Button>
              <Button onClick={applyFilter}>Apply Filter</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <Modal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Transaction"
          description="Are you sure you want to delete this transaction? This action cannot be undone."
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
