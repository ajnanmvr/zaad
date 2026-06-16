"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { TEntityListItem, TPagination } from "@/types/types";
import formatDate from "@/utils/formatDate";
import { exportRowsCsv, exportRowsExcel, exportRowsPdf } from "@/utils/exportTableData";

import DocumentStatusSummary from "../common/DocumentStatusSummary";
import ExportActionsMenu from "../common/ExportActionsMenu";
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
  searchValue,
  onSearchChange,
  sortBy: sortByProp,
  onSortChange,
  createdWithinDays: createdWithinDaysProp,
  onCreatedWithinDaysChange,
  showDeleted,
  onShowDeletedChange,
}: {
  employees: TEntityListItem[] | null | undefined;
  isLoading?: boolean;
  pagination?: TPagination;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  addEntityHref?: string;
  addEntityLabel?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  sortBy?: EntitySort;
  onSortChange?: (value: EntitySort) => void;
  createdWithinDays?: number | undefined;
  onCreatedWithinDaysChange?: (value: number | undefined) => void;
  showDeleted?: boolean;
  onShowDeletedChange?: (value: boolean) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isBackendFiltered = onSearchChange !== undefined;

  const [localSearchInput, setLocalSearchInput] = useState("");
  const [localSortBy, setLocalSortBy] = useState<EntitySort>("newest");
  const [localCreatedWithinDays, setLocalCreatedWithinDays] = useState<number | undefined>(
    undefined
  );

  const currentSearchInput = isBackendFiltered ? (searchValue ?? "") : localSearchInput;
  const currentSortBy = isBackendFiltered ? (sortByProp ?? "newest") : localSortBy;
  const currentCreatedWithinDays = isBackendFiltered ? createdWithinDaysProp : localCreatedWithinDays;

  const handleSearchChange = (val: string) => {
    if (isBackendFiltered && onSearchChange) {
      onSearchChange(val);
    } else {
      setLocalSearchInput(val);
    }
  };

  const handleSortChange = (val: EntitySort) => {
    if (isBackendFiltered && onSortChange) {
      onSortChange(val);
    } else {
      setLocalSortBy(val);
    }
  };

  const handleCreatedWithinDaysChange = (val: number | undefined) => {
    if (isBackendFiltered && onCreatedWithinDaysChange) {
      onCreatedWithinDaysChange(val);
    } else {
      setLocalCreatedWithinDays(val);
    }
  };

  const list = useMemo(() => employees ?? [], [employees]);

  const filteredEmployees = useMemo(() => {
    if (isBackendFiltered) {
      return list;
    }

    const normalizedSearch = localSearchInput.trim().toLowerCase();
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

      if (!localCreatedWithinDays || !employee.createdAt) {
        return true;
      }

      const createdAt = new Date(employee.createdAt).getTime();
      const daysMs = localCreatedWithinDays * 24 * 60 * 60 * 1000;
      return now - createdAt <= daysMs;
    });

    filtered.sort((a, b) => {
      if (localSortBy === "newest") {
        return (
          new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
        );
      }
      if (localSortBy === "oldest") {
        return (
          new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime()
        );
      }
      if (localSortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      return b.name.localeCompare(a.name);
    });

    return filtered;
  }, [list, isBackendFiltered, localSearchInput, localSortBy, localCreatedWithinDays]);

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
      subtitle="Company team members linked to this profile."
        addEntityHref={addEntityHref}
        addEntityLabel={addEntityLabel}
        totalCount={totalCount}
        searchValue={currentSearchInput}
        onSearchChange={handleSearchChange}
        sortBy={currentSortBy}
        onSortChange={handleSortChange}
        createdWithinDays={currentCreatedWithinDays}
        onCreatedWithinDaysChange={handleCreatedWithinDaysChange}
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
        compactHeaderControls
        headerActions={
          <div className="flex items-center gap-2">
            {onShowDeletedChange && (
              <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => onShowDeletedChange(false)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${!showDeleted ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => onShowDeletedChange(true)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${showDeleted ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
                >
                  Deleted
                </button>
              </div>
            )}
            <ExportActionsMenu onExport={exportSelection} iconOnly selectedCount={selectedRows.length} />
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
                  className={`group border-b border-slate-100 transition-colors last:border-0 dark:border-slate-800 ${showDeleted ? "opacity-70 hover:opacity-100" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50"}`}
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
                      <EntityAvatar name={name} color={showDeleted ? undefined : color} size="md" />
                      <Link href={`/employee/${id}`}>
                        <div className="flex flex-col gap-1">
                          <h5 className={`font-semibold capitalize transition-colors group-hover:text-primary ${showDeleted ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}>
                            {name}
                          </h5>
                          {showDeleted && (
                            <span className="inline-flex w-fit items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                              Deleted
                            </span>
                          )}
                        </div>
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
