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
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 320);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(PAGINATION.DEFAULT_PAGE);
    setSelectedIds([]);
  }, [search, sortBy, createdWithinDays, showDeleted]);

  const { data, isLoading } = useQuery<TPaginatedResponse<TEntityListItem>>({
    queryKey: ["individuals", page, limit, search, sortBy, createdWithinDays, showDeleted],
    queryFn: () => fetchIndividuals(page, limit, { search, sortBy, createdWithinDays, deleted: showDeleted }),
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
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleted(false)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${!showDeleted ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setShowDeleted(true)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${showDeleted ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
              >
                Deleted
              </button>
            </div>
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
                  className={`group border-b border-slate-100 transition-colors last:border-0 dark:border-slate-800 ${showDeleted ? "opacity-70 hover:opacity-100" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50"}`}
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
                        color={showDeleted ? undefined : individual.color}
                        size="md"
                      />
                      <Link href={`/individual/${individual.id}`}>
                        <div className="flex flex-col gap-1">
                          <h5 className={`font-semibold capitalize transition-colors hover:text-primary ${showDeleted ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}>
                            {individual.name}
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
