"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { FiArrowUpRight, FiClock, FiFilter, FiList, FiPlus, FiSearch, FiSliders, FiX } from "react-icons/fi";

import { TPagination } from "@/types/types";

type EntitySort = "newest" | "oldest" | "name-asc" | "name-desc";

type EntityListingShellProps = {
  title?: string;
  subtitle?: string;
  totalCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortBy: EntitySort;
  onSortChange: (value: EntitySort) => void;
  createdWithinDays?: number;
  onCreatedWithinDaysChange: (value: number | undefined) => void;
  isLoading: boolean;
  loadingContent: ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  hasData: boolean;
  children: ReactNode;
  pagination?: TPagination;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  addEntityHref?: string;
  addEntityLabel?: string;
  pageSize?: number;
  onPageSizeChange?: (value: number) => void;
  pageSizeOptions?: number[];
  headerActions?: ReactNode;
  compactHeaderControls?: boolean;
};

function EntityListingShell({
  title,
  subtitle,
  totalCount,
  searchValue,
  onSearchChange,
  sortBy,
  onSortChange,
  createdWithinDays,
  onCreatedWithinDaysChange,
  isLoading,
  loadingContent,
  emptyTitle,
  emptyDescription,
  hasData,
  children,
  pagination,
  onPrevPage,
  onNextPage,
  addEntityHref,
  addEntityLabel,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
  headerActions,
  compactHeaderControls,
}: EntityListingShellProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftPageSize, setDraftPageSize] = useState<number>(pageSize || 10);
  const [draftSortBy, setDraftSortBy] = useState<EntitySort>(sortBy);
  const [draftCreatedWithinDays, setDraftCreatedWithinDays] = useState<number | "all">(createdWithinDays ?? "all");

  const normalizedDraftCreatedWithinDays = draftCreatedWithinDays === "all" ? undefined : Number(draftCreatedWithinDays);
  const hasPendingChanges =
    (onPageSizeChange ? draftPageSize !== pageSize : false) ||
    draftSortBy !== sortBy ||
    normalizedDraftCreatedWithinDays !== createdWithinDays;

  useEffect(() => {
    const onOverlayOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ source?: string }>;
      if (customEvent.detail?.source === "export") {
        setIsFilterOpen(false);
      }
    };

    window.addEventListener("entity-overlay-open", onOverlayOpen as EventListener);
    return () => {
      window.removeEventListener("entity-overlay-open", onOverlayOpen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isFilterOpen) return;

    setDraftPageSize(pageSize || 10);
    setDraftSortBy(sortBy);
    setDraftCreatedWithinDays(createdWithinDays ?? "all");
  }, [isFilterOpen, pageSize, sortBy, createdWithinDays]);

  const applyCompactFilters = () => {
    if (onPageSizeChange && draftPageSize !== pageSize) {
      onPageSizeChange(draftPageSize);
    }

    if (draftSortBy !== sortBy) {
      onSortChange(draftSortBy);
    }

    if (normalizedDraftCreatedWithinDays !== createdWithinDays) {
      onCreatedWithinDaysChange(normalizedDraftCreatedWithinDays);
    }

    setIsFilterOpen(false);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none">
      <div className="relative z-30 overflow-visible border-b border-slate-200/80 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-cyan-200/40 blur-2xl dark:bg-cyan-500/10" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-emerald-200/50 blur-xl dark:bg-emerald-500/10" />

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="hidden sm:block">
              {title ? (
                <p className="text-base font-black tracking-tight text-slate-800 dark:text-slate-200">
                  {title}
                </p>
              ) : (
                <p className="text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-400">
                  Refine Results
                </p>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-500">{subtitle}</p>
              )}
            </div>

            <div className="relative flex items-center gap-2">
              {addEntityHref && addEntityLabel && (
                <Link
                  href={addEntityHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700"
                >
                  <FiPlus className="text-base" />
                  <span className="hidden sm:inline">{addEntityLabel}</span>
                </Link>
              )}

              {compactHeaderControls && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFilterOpen((prev) => {
                        const next = !prev;
                        if (next) {
                          window.dispatchEvent(new CustomEvent("entity-overlay-open", { detail: { source: "filter" } }));
                        }
                        return next;
                      });
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                    title="Filter list controls"
                  >
                    <FiSliders />
                  </button>

                  {headerActions}
                </>
              )}

              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {totalCount} Total
              </div>
            </div>
          </div>

          {compactHeaderControls && isFilterOpen && (
            <div className="relative h-0">
              <div className="absolute right-0 top-2 z-50 w-[18rem] max-w-[calc(100vw-3rem)] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:w-[20rem]">
                <div className="flex flex-col gap-3">
                  {onPageSizeChange && (
                    <label>
                      <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <FiList className="text-[12px]" />
                        Rows
                      </span>
                      <select
                        title="Rows per page"
                        value={draftPageSize}
                        onChange={(event) => setDraftPageSize(Number(event.target.value))}
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        {(pageSizeOptions || [10, 20, 30, 50, 100]).map((option) => (
                          <option key={option} value={option}>
                            Show {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <label>
                    <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <FiArrowUpRight className="text-[12px]" />
                      Sort
                    </span>
                    <select
                      value={draftSortBy}
                      onChange={(event) => setDraftSortBy(event.target.value as EntitySort)}
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name-asc">Name A-Z</option>
                      <option value="name-desc">Name Z-A</option>
                    </select>
                  </label>

                  <label>
                    <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <FiClock className="text-[12px]" />
                      Time
                    </span>
                    <select
                      value={draftCreatedWithinDays}
                      onChange={(event) => {
                        const value = event.target.value;
                        setDraftCreatedWithinDays(value === "all" ? "all" : Number(value));
                      }}
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <option value="all">All Time</option>
                      <option value="30">Created Last 30 Days</option>
                      <option value="90">Created Last 90 Days</option>
                      <option value="365">Created Last 12 Months</option>
                    </select>
                  </label>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={applyCompactFilters}
                      disabled={!hasPendingChanges}
                      className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={compactHeaderControls ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 gap-3 lg:grid-cols-3"}>
            <div className="relative lg:col-span-1">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search by name..."
                className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-11 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  title="Clear search"
                >
                  <FiX />
                </button>
              )}
            </div>

            {!compactHeaderControls && (
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3 dark:border-slate-700 dark:bg-slate-900">
                <FiArrowUpRight className="text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(event) => onSortChange(event.target.value as EntitySort)}
                  className="h-12 w-full bg-transparent text-sm font-medium text-slate-700 outline-none dark:text-slate-200"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                </select>
              </label>
            )}

            {!compactHeaderControls && (
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3 dark:border-slate-700 dark:bg-slate-900">
                <FiFilter className="text-slate-400" />
                <select
                  value={createdWithinDays ?? "all"}
                  onChange={(event) => {
                    const value = event.target.value;
                    onCreatedWithinDaysChange(value === "all" ? undefined : Number(value));
                  }}
                  className="h-12 w-full bg-transparent text-sm font-medium text-slate-700 outline-none dark:text-slate-200"
                >
                  <option value="all">All Time</option>
                  <option value="30">Created Last 30 Days</option>
                  <option value="90">Created Last 90 Days</option>
                  <option value="365">Created Last 12 Months</option>
                </select>
              </label>
            )}
          </div>

          {(onPageSizeChange || headerActions) && !compactHeaderControls && (
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/85 p-3 dark:border-slate-700 dark:bg-slate-900/85">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Export And List Controls
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                {onPageSizeChange ? (
                  <select
                    title="Rows per page"
                    value={pageSize}
                    onChange={(event) => onPageSizeChange(Number(event.target.value))}
                    className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {(pageSizeOptions || [10, 20, 30, 50, 100]).map((option) => (
                      <option key={option} value={option}>
                        Show {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span />
                )}

                {headerActions}
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 sm:p-7">{loadingContent}</div>
      ) : (
        <div className="relative z-10 p-6 sm:p-7">
          {hasData ? (
            children
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-white to-slate-50 px-6 py-14 text-center dark:border-slate-700 dark:from-slate-900 dark:to-slate-900">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{emptyTitle}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{emptyDescription}</p>
            </div>
          )}

          {pagination && onPrevPage && onNextPage && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onPrevPage}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={onNextPage}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EntityListingShell;
