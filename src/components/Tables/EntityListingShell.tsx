"use client";

import Link from "next/link";
import { ReactNode } from "react";
import {
  FiArrowUpRight,
  FiFilter,
  FiPlus,
  FiSearch,
  FiX,
} from "react-icons/fi";

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
}: EntityListingShellProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none">
      <div className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-cyan-200/40 blur-2xl dark:bg-cyan-500/10" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-emerald-200/50 blur-xl dark:bg-emerald-500/10" />

        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="hidden sm:block">
              {title ? (
                <p className="text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-400">
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

            <div className="flex items-center gap-2">
              {addEntityHref && addEntityLabel && (
                <Link
                  href={addEntityHref}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700"
                >
                  <FiPlus className="text-base" />
                  {addEntityLabel}
                </Link>
              )}

              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {totalCount} Total
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
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
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 sm:p-7">{loadingContent}</div>
      ) : (
        <div className="p-6 sm:p-7">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-400">
            <span>{totalCount} results</span>
            <span className="inline-flex items-center gap-1">
              <FiArrowUpRight className="text-sm" />
              Sorted by {sortBy.replace("-", " ")}
            </span>
          </div>

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
