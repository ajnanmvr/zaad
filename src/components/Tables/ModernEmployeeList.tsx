"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Plus, Download, Eye, Edit, FileText } from "lucide-react";
import { fetchEmployees } from "@/libs/queries";
import { TEmployeeList } from "@/types/types";
import { DataTable, Column } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { StatsCard } from "../ui/StatsCard";
import Link from "next/link";

export default function ModernEmployeeList() {
  const { data: employees, isLoading } = useQuery<TEmployeeList[] | null>({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
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

  const columns: Column<TEmployeeList>[] = [
    {
      key: "name",
      title: "Name",
      sortable: true,
      render: (value, row) => (
        <Link
          href={`/employee/${row.id || row._id}`}
          className="font-medium capitalize hover:text-emerald-600 transition-colors"
        >
          {value}
        </Link>
      ),
    },
    {
      key: "passport",
      title: "Passport",
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
          <Link href={`/employee/${row.id || row._id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/employee/${row.id || row._id}/edit`}>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  // Calculate stats
  const totalEmployees = employees?.length || 0;
  const activeEmployees = employees?.filter((e) => e.status === "active").length || 0;
  const renewalCount = employees?.filter((e) => e.status === "renewal" || e.status === "expired").length || 0;
  const totalBalance = employees?.reduce((sum, e) => sum + parseFloat(e.balance || "0"), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-boxdark-2">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark backdrop-blur-sm bg-white/80 dark:bg-boxdark/80">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">Individuals</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage individual profiles and documents
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Download className="h-5 w-5" />
            </Button>
            <Link href="/employee/register">
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                New Individual
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Individuals"
            value={totalEmployees.toString()}
            icon={<Users className="h-6 w-6" />}
            loading={isLoading}
          />
          <StatsCard
            title="Active"
            value={activeEmployees.toString()}
            icon={<Users className="h-6 w-6" />}
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
            icon={<Users className="h-6 w-6" />}
            variant={totalBalance < 0 ? "success" : "danger"}
            loading={isLoading}
          />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm p-6">
          <DataTable
            data={employees || []}
            columns={columns}
            loading={isLoading}
            searchable
            searchPlaceholder="Search individuals..."
            emptyMessage="No individuals found"
          />
        </div>
      </div>
    </div>
  );
}
