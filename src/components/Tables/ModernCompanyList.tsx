"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Plus, Download, Eye, Edit, Trash2, FileText } from "lucide-react";
import { fetchCompanies } from "@/libs/queries";
import { TCompanyList } from "@/types/types";
import { DataTable, Column } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { StatsCard } from "../ui/StatsCard";
import Link from "next/link";

export default function ModernCompanyList() {
  const { data: companies, isLoading } = useQuery<TCompanyList[] | null>({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });

  const getStatusVariant = (status: string) => {
    const variants: Record<string, any> = {
      active: "success",
      expired: "danger",
      renewal: "warning",
      inactive: "secondary",
    };
    return variants[status] || "default";
  };

  const columns: Column<TCompanyList>[] = [
    {
      key: "name",
      title: "Company Name",
      sortable: true,
      render: (value, row) => (
        <Link
          href={`/company/${row.id || row._id}`}
          className="font-medium capitalize hover:text-emerald-600 transition-colors"
        >
          {value}
        </Link>
      ),
    },
    {
      key: "tradeLicense",
      title: "Trade License",
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
          {value || "—"}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      render: (value) => (
        <Badge variant={getStatusVariant(value)}>
          {value}
        </Badge>
      ),
    },
    {
      key: "balance",
      title: "Balance",
      sortable: true,
      align: "right",
      render: (value) => {
        const balance = parseFloat(value || "0");
        return (
          <span
            className={`font-semibold ${
              balance > 0
                ? "text-red"
                : balance < 0
                ? "text-emerald-600"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {balance.toFixed(2)} AED
          </span>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/company/${row.id || row._id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/company/${row.id || row._id}/edit`}>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  // Calculate stats
  const totalCompanies = companies?.length || 0;
  const activeCompanies = companies?.filter((c) => c.status === "active").length || 0;
  const renewalCount = companies?.filter((c) => c.status === "renewal" || c.status === "expired").length || 0;
  const totalBalance = companies?.reduce((sum, c) => sum + parseFloat(c.balance || "0"), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-boxdark-2">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark backdrop-blur-sm bg-white/80 dark:bg-boxdark/80">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">Companies</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage company profiles and documents
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Download className="h-5 w-5" />
            </Button>
            <Link href="/company/register">
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                New Company
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Companies"
            value={totalCompanies.toString()}
            icon={<Building2 className="h-6 w-6" />}
            loading={isLoading}
          />
          <StatsCard
            title="Active"
            value={activeCompanies.toString()}
            icon={<Building2 className="h-6 w-6" />}
            variant="success"
            loading={isLoading}
          />
          <StatsCard
            title="Pending Renewal"
            value={renewalCount.toString()}
            icon={<FileText className="h-6 w-6" />}
            variant="warning"
            loading={isLoading}
          />
          <StatsCard
            title="Total Balance"
            value={`${totalBalance.toFixed(2)} AED`}
            icon={<Building2 className="h-6 w-6" />}
            variant={totalBalance < 0 ? "success" : "danger"}
            loading={isLoading}
          />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm p-6">
          <DataTable
            data={companies || []}
            columns={columns}
            loading={isLoading}
            searchable
            searchPlaceholder="Search companies..."
            emptyMessage="No companies found"
          />
        </div>
      </div>
    </div>
  );
}
