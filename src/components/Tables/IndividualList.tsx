"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import toast from "react-hot-toast";

import { fetchIndividuals } from "@/libs/queries";
import { PAGINATION } from "@/config/pagination";
import { TEntityListItem, TPaginatedResponse } from "@/types/types";
import formatDate from "@/utils/formatDate";
import { exportRowsCsv, exportRowsExcel, exportRowsPdf } from "@/utils/exportTableData";

import DocumentStatusSummary from "../common/DocumentStatusSummary";
import ExportActionsMenu from "../common/ExportActionsMenu";
import EntityAvatar from "../common/EntityAvatar";
import SkeletonList from "../common/SkeletonList";
import EntityListingShell from "./EntityListingShell";

type EntitySort = "newest" | "oldest" | "name-asc" | "name-desc";

function IndividualList() {
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [limit, setLimit] = useState<number>(PAGINATION.LIMITS.ENTITY_LIST);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<EntitySort>("newest");
  const [createdWithinDays, setCreatedWithinDays] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 320);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(PAGINATION.DEFAULT_PAGE);
    setSelectedIds([]);
  }, [search, sortBy, createdWithinDays]);

  const { data, isLoading } = useQuery<TPaginatedResponse<TEntityListItem>>({
    queryKey: ["individuals", page, limit, search, sortBy, createdWithinDays],
    queryFn: () => fetchIndividuals(page, limit, { search, sortBy, createdWithinDays }),
  });

  const individuals = data?.data || [];
  const pagination = data?.pagination;

  const allSelected =
    individuals.length > 0 &&
    individuals.every((row) => selectedIds.includes(String(row.id)));

  const selectedRows = individuals.filter((row) => selectedIds.includes(String(row.id)));

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
    const sourceRows = mode === "selected" ? selectedRows : individuals;
    const rows = mapExportRows(sourceRows);
    if (!rows.length) {
      toast.error(mode === "selected" ? "Select individuals first" : "No individuals to export");
      return;
    }

    if (format === "csv") {
      exportRowsCsv(rows, "individuals");
    } else if (format === "excel") {
      exportRowsExcel(rows, "individuals");
    } else {
      await exportRowsPdf(rows, "individuals");
    }

    toast.success(`${mode === "selected" ? "Selected" : "Visible"} individuals exported as ${format.toUpperCase()}`);
  };

  return (
    <>
      <EntityListingShell
        title="Individual Directory"
        subtitle="Individual profiles linked to records, documents, and handovers."
        addEntityHref="/individual/register"
        addEntityLabel="Add Individual"
        totalCount={pagination?.total ?? individuals.length}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        sortBy={sortBy}
        onSortChange={setSortBy}
        createdWithinDays={createdWithinDays}
        onCreatedWithinDaysChange={setCreatedWithinDays}
        isLoading={isLoading}
        loadingContent={
          <>
            <div className="mt-4 flex justify-around rounded-t-lg bg-slate-50 text-left font-medium text-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
              <div className="min-w-[220px] px-4 py-4 xl:pl-11">Name</div>
              <div className="min-w-[150px] px-4 py-4">Created</div>
              <div className="min-w-[220px] px-4 py-4">Documents</div>
            </div>
            <SkeletonList />
          </>
        }
        emptyTitle="No individuals found"
        emptyDescription="Try a broader search or switch filters to see more results."
        hasData={individuals.length > 0}
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
                    aria-label="Select all individuals"
                    checked={allSelected}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedIds(individuals.map((row) => String(row.id)));
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
              {individuals.map((individual, key) => (
                <tr
                  key={key}
                  className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-3 py-4">
                    <input
                      type="checkbox"
                      aria-label={`Select ${individual.name}`}
                      checked={selectedIds.includes(String(individual.id))}
                      onChange={(event) => {
                        setSelectedIds((prev) =>
                          event.target.checked
                            ? Array.from(new Set([...prev, String(individual.id)]))
                            : prev.filter((rowId) => rowId !== String(individual.id))
                        );
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                  </td>
                  <td className="py-4 pl-4">
                    <div className="flex items-center gap-3">
                      <EntityAvatar
                        name={individual.name}
                        color={individual.color}
                        size="md"
                      />
                      <Link href={`/individual/${individual.id}`}>
                        <h5 className="font-semibold capitalize text-slate-800 transition-colors hover:text-primary dark:text-slate-200">
                          {individual.name}
                        </h5>
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {formatDate(individual.createdAt || null)}
                  </td>
                  <td className="px-4 py-4">
                    <DocumentStatusSummary counts={individual.documentStatusCounts} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EntityListingShell>
    </>
  );
}

export default IndividualList;
