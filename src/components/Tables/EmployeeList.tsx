"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiDownload } from "react-icons/fi";

import { TEntityListItem, TPagination } from "@/types/types";
import formatDate from "@/utils/formatDate";
import { exportRowsCsv, exportRowsExcel, exportRowsPdf } from "@/utils/exportTableData";

import DocumentStatusSummary from "../common/DocumentStatusSummary";
import EntityAvatar from "../common/EntityAvatar";
import SkeletonList from "../common/SkeletonList";
import EntityListingShell from "./EntityListingShell";

type EntitySort = "newest" | "oldest" | "name-asc" | "name-desc";

function EmployeeList({
  employees,
  isLoading,
  pagination,
  onPageChange,
  pageSize,
  onPageSizeChange,
  addEntityHref,
  addEntityLabel,
}: {
  employees: TEntityListItem[] | null | undefined;
  isLoading?: boolean;
  pagination?: TPagination;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  addEntityHref?: string;
  addEntityLabel?: string;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<EntitySort>("newest");
  const [createdWithinDays, setCreatedWithinDays] = useState<number | undefined>(
    undefined
  );

  const list = useMemo(() => employees ?? [], [employees]);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = searchInput.trim().toLowerCase();
    const now = Date.now();

    const filtered = list.filter((employee) => {
      const nameMatch = employee.name.toLowerCase().includes(normalizedSearch);
      const companyMatch = employee.company?.name
        ?.toLowerCase()
        .includes(normalizedSearch);
      const searchMatch =
        normalizedSearch.length === 0 ? true : nameMatch || Boolean(companyMatch);

      if (!searchMatch) {
        return false;
      }

      if (!createdWithinDays || !employee.createdAt) {
        return true;
      }

      const createdAt = new Date(employee.createdAt).getTime();
      const daysMs = createdWithinDays * 24 * 60 * 60 * 1000;
      return now - createdAt <= daysMs;
    });

    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime()
        );
      }
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      return b.name.localeCompare(a.name);
    });

    return filtered;
  }, [list, searchInput, sortBy, createdWithinDays]);

  const totalCount = pagination?.total ?? filteredEmployees.length;
  const allSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((row) => selectedIds.includes(String(row.id)));

  const selectedRows = filteredEmployees.filter((row) => selectedIds.includes(String(row.id)));

  const mapExportRows = (rows: TEntityListItem[]) =>
    rows.map((row) => ({
      Name: row.name,
      Company: row.company?.name || "",
      EntityType: row.entityType,
      CreatedAt: formatDate(row.createdAt || null),
      ExpiredDocs: row.documentStatusCounts?.expired || 0,
      RenewalDocs: row.documentStatusCounts?.renewal || 0,
      ValidDocs: row.documentStatusCounts?.valid || 0,
    }));

  const exportSelection = async (format: "csv" | "excel" | "pdf", mode: "selected" | "all") => {
    const sourceRows = mode === "selected" ? selectedRows : filteredEmployees;
    const rows = mapExportRows(sourceRows);
    if (!rows.length) {
      toast.error(mode === "selected" ? "Select employees first" : "No employees to export");
      return;
    }

    if (format === "csv") {
      exportRowsCsv(rows, "employees");
    } else if (format === "excel") {
      exportRowsExcel(rows, "employees");
    } else {
      await exportRowsPdf(rows, "employees");
    }

    toast.success(`${mode === "selected" ? "Selected" : "Visible"} employees exported as ${format.toUpperCase()}`);
  };

  return (
    <EntityListingShell
        title="Employee Directory"
        subtitle="Search, sort, and filter employees in one unified view."
        addEntityHref={addEntityHref}
        addEntityLabel={addEntityLabel}
        totalCount={totalCount}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        sortBy={sortBy}
        onSortChange={setSortBy}
        createdWithinDays={createdWithinDays}
        onCreatedWithinDaysChange={setCreatedWithinDays}
        isLoading={Boolean(isLoading)}
        loadingContent={
          <>
            <div className="mt-4 flex justify-around rounded-t-lg bg-slate-50 text-left font-medium text-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
              <div className="min-w-[220px] px-4 py-4 xl:pl-11">Name</div>
              <div className="min-w-[170px] px-4 py-4">Company</div>
              <div className="min-w-[150px] px-4 py-4">Created</div>
              <div className="min-w-[220px] px-4 py-4">Documents</div>
            </div>
            <SkeletonList />
          </>
        }
        emptyTitle="No employees found"
        emptyDescription="Try a broader search or switch filters to see more results."
        hasData={filteredEmployees.length > 0}
        pagination={pagination}
        onPrevPage={
          pagination && onPageChange
            ? () => onPageChange(Math.max(pagination.page - 1, 1))
            : undefined
        }
        onNextPage={
          pagination && onPageChange
            ? () => onPageChange(pagination.page + 1)
            : undefined
        }
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        headerActions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportSelection("csv", "selected")}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FiDownload /> CSV Selected
            </button>
            <button
              type="button"
              onClick={() => exportSelection("excel", "selected")}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FiDownload /> Excel Selected
            </button>
            <button
              type="button"
              onClick={() => exportSelection("pdf", "selected")}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FiDownload /> PDF Selected
            </button>
            <button
              type="button"
              onClick={() => exportSelection("csv", "all")}
              className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-cyan-700"
            >
              <FiDownload /> CSV All
            </button>
          </div>
        }
      >
        <div className="max-w-full overflow-x-auto">
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm font-semibold tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="px-3 pb-3">
                  <input
                    type="checkbox"
                    aria-label="Select all employees"
                    checked={allSelected}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedIds(filteredEmployees.map((row) => String(row.id)));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                </th>
                <th className="min-w-[220px] pb-3 pl-4">Name</th>
                <th className="min-w-[170px] px-4 pb-3">Company</th>
                <th className="min-w-[150px] px-4 pb-3">Created</th>
                <th className="min-w-[220px] px-4 pb-3">Documents</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(({ id, name, company, createdAt, color, documentStatusCounts }, key) => (
                <tr
                  key={key}
                  className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-3 py-4">
                    <input
                      type="checkbox"
                      aria-label={`Select ${name}`}
                      checked={selectedIds.includes(String(id))}
                      onChange={(event) => {
                        setSelectedIds((prev) =>
                          event.target.checked
                            ? Array.from(new Set([...prev, String(id)]))
                            : prev.filter((rowId) => rowId !== String(id))
                        );
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                  </td>
                  <td className="py-4 pl-4">
                    <div className="flex items-center gap-3">
                      <EntityAvatar name={name} color={color} size="md" />
                      <Link href={`/employee/${id}`}>
                        <h5 className="font-semibold capitalize text-slate-800 transition-colors group-hover:text-primary dark:text-slate-200">
                          {name}
                        </h5>
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {company?._id ? (
                      <Link
                        href={`/company/${company._id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {company.name}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {formatDate(createdAt || null)}
                  </td>
                  <td className="px-4 py-4">
                    <DocumentStatusSummary counts={documentStatusCounts} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EntityListingShell>
  );
}

export default EmployeeList;
