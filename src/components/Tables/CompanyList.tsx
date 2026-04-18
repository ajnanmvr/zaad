"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { PAGINATION } from "@/config/pagination";
import { fetchCompanies } from "@/libs/queries";
import { TEntityListItem, TPaginatedResponse } from "@/types/types";
import formatDate from "@/utils/formatDate";
import { exportRowsCsv, exportRowsExcel, exportRowsPdf } from "@/utils/exportTableData";

import DocumentStatusSummary from "../common/DocumentStatusSummary";
import ExportActionsMenu from "../common/ExportActionsMenu";
import EntityAvatar from "../common/EntityAvatar";
import SkeletonList from "../common/SkeletonList";
import EntityListingShell from "./EntityListingShell";

type CompanySort = "newest" | "oldest" | "name-asc" | "name-desc";

function CompanyList() {
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [limit, setLimit] = useState<number>(PAGINATION.LIMITS.ENTITY_LIST);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<CompanySort>("newest");
  const [createdWithinDays, setCreatedWithinDays] = useState<number | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 320);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(PAGINATION.DEFAULT_PAGE);
  }, [search, sortBy, createdWithinDays]);

  const {
    data: companiesResponse,
    isLoading: companyLoading,
    isError: companyError,
  } = useQuery<TPaginatedResponse<TEntityListItem>>({
    queryKey: ["companies", page, limit, search, sortBy, createdWithinDays],
    queryFn: () => fetchCompanies(page, limit, { search, sortBy, createdWithinDays }),
  });

  const companies = companiesResponse?.data || [];
  const pagination = companiesResponse?.pagination;

  if (companyError) {
    toast.error("Failed to fetch companies");
  }

  const totalCount = useMemo(() => pagination?.total ?? companies.length, [pagination, companies.length]);
  const allSelected = companies.length > 0 && companies.every((row) => selectedIds.includes(String(row.id)));

  const selectedRows = companies.filter((row) => selectedIds.includes(String(row.id)));

  const mapExportRows = (rows: TEntityListItem[]) =>
    rows.map((row) => ({
      Name: row.name,
      EntityType: row.entityType,
      CreatedAt: formatDate(row.createdAt || null),
      ExpiredDocs: row.documentStatusCounts?.expired || 0,
      RenewalDocs: row.documentStatusCounts?.renewal || 0,
      ValidDocs: row.documentStatusCounts?.valid || 0,
    }));

  const exportSelection = async (format: "csv" | "excel" | "pdf", mode: "selected" | "all") => {
    const sourceRows = mode === "selected" ? selectedRows : companies;
    const rows = mapExportRows(sourceRows);
    if (!rows.length) {
      toast.error(mode === "selected" ? "Select companies first" : "No companies to export");
      return;
    }

    if (format === "csv") {
      exportRowsCsv(rows, "companies");
    } else if (format === "excel") {
      exportRowsExcel(rows, "companies");
    } else {
      await exportRowsPdf(rows, "companies");
    }

    toast.success(`${mode === "selected" ? "Selected" : "Visible"} companies exported as ${format.toUpperCase()}`);
  };

  return (
    <EntityListingShell
      title="Entity Directory"
      subtitle="Company profiles with quick access to records and compliance status."
      addEntityHref="/company/register"
      addEntityLabel="Add Company"
      totalCount={totalCount}
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      sortBy={sortBy}
      onSortChange={setSortBy}
      createdWithinDays={createdWithinDays}
      onCreatedWithinDaysChange={setCreatedWithinDays}
      isLoading={companyLoading}
      loadingContent={
        <>
          <div className="mt-1 flex justify-around rounded-t-lg bg-slate-50 text-left font-medium text-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
            <div className="min-w-[220px] px-4 py-4 xl:pl-11">Name</div>
            <div className="min-w-[150px] px-4 py-4">Created</div>
            <div className="min-w-[220px] px-4 py-4">Documents</div>
          </div>
          <SkeletonList />
        </>
      }
      emptyTitle="No companies found"
      emptyDescription="Try a broader search or switch filters to see more results."
      hasData={companies.length > 0}
      pagination={pagination}
      onPrevPage={() => setPage((prev) => Math.max(prev - 1, 1))}
      onNextPage={() => setPage((prev) => prev + 1)}
      pageSize={limit}
      onPageSizeChange={(value) => {
        setLimit(value);
        setPage(PAGINATION.DEFAULT_PAGE);
        setSelectedIds([]);
      }}
      compactHeaderControls
      headerActions={
        <ExportActionsMenu onExport={exportSelection} iconOnly selectedCount={selectedRows.length} />
      }
    >
      <div className="max-w-full overflow-x-auto">
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-sm font-semibold tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="px-3 pb-3">
                <input
                  type="checkbox"
                  aria-label="Select all companies"
                  checked={allSelected}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setSelectedIds(companies.map((row) => String(row.id)));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
              </th>
              <th className="min-w-[220px] pb-3 pl-4">Name</th>
              <th className="min-w-[150px] px-4 pb-3">Created</th>
              <th className="min-w-[220px] px-4 pb-3">Documents</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(({ id, name, createdAt, color, documentStatusCounts }, key) => (
              <tr
                key={key}
                className="group border-b border-slate-100 transition-colors hover:bg-slate-50/70 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/40"
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
                  <Link href={`/company/${id}`}>
                    <div className="flex items-center gap-3">
                      <EntityAvatar name={name} color={color} size="md" />
                      <h5 className="font-semibold capitalize text-slate-800 transition-colors group-hover:text-primary dark:text-slate-200">
                        {name}
                      </h5>
                    </div>
                  </Link>
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

export default CompanyList;
