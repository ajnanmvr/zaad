"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/utils/cn";
import { Input } from "./Input";
import { Button } from "./Button";

export interface Column<T> {
  key: string;
  title: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (row: T, index: number) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onRowClick,
  searchable = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No data available",
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data;

    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null;
    });
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-4 w-4 text-emerald-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-emerald-600" />
    );
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Search */}
      {searchable && (
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-stroke dark:border-strokedark">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    style={{ width: column.width }}
                    className={cn(
                      "px-4 py-3 text-sm font-semibold text-black dark:text-white",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      column.sortable && "cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        column.align === "center" && "justify-center",
                        column.align === "right" && "justify-end"
                      )}
                    >
                      <span>{column.title}</span>
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                sortedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    onClick={() => onRowClick?.(row, rowIndex)}
                    className={cn(
                      "transition-colors",
                      onRowClick &&
                        "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "px-4 py-3 text-sm text-gray-700 dark:text-gray-300",
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right"
                        )}
                      >
                        {column.render
                          ? column.render(row[column.key], row, rowIndex)
                          : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer with count */}
      {!loading && sortedData.length > 0 && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Showing {sortedData.length} {sortedData.length === 1 ? "row" : "rows"}
          {searchQuery && ` (filtered from ${data.length})`}
        </div>
      )}
    </div>
  );
}
