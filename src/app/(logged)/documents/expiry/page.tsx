"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { fetchExpiryDocuments } from "@/libs/queries";
import { TExpiryDocumentItem, TPaginatedResponse } from "@/types/types";
import calculateStatus from "@/utils/calculateStatus";
import formatDate from "@/utils/formatDate";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { PAGINATION } from "@/config/pagination";
import Link from "next/link";
import { FiAlertCircle, FiCalendar, FiDownload, FiFileText } from "react-icons/fi";
import EntityAvatar from "@/components/common/EntityAvatar";
import { exportRowsCsv, exportRowsExcel, exportRowsPdf } from "@/utils/exportTableData";
import { toast } from "react-hot-toast";

const ExpiryDocumentsPage = () => {
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [limit, setLimit] = useState<number>(PAGINATION.LIMITS.EXPIRY_DOCUMENTS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, isError } = useQuery<
    TPaginatedResponse<TExpiryDocumentItem>
  >({
    queryKey: ["expiry-documents", page, limit],
    queryFn: () => fetchExpiryDocuments(page, limit),
  });

  const rows = useMemo(() => data?.data || [], [data]);
  const pagination = data?.pagination;
  const [nameFilter, setNameFilter] = useState("all");

  const documentNames = useMemo(() => {
    return Array.from(
      new Set(
        rows
          .map((item) => item?.name?.trim())
          .filter((value): value is string => Boolean(value))
      )
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (nameFilter === "all") {
      return rows;
    }
    return rows.filter((item) => (item.name || "unnamed") === nameFilter);
  }, [rows, nameFilter]);

  const statusCounts = useMemo(() => {
    return rows.reduce(
      (acc, item) => {
        const status = item.status || calculateStatus(item.expiryDate || "");
        if (status === "expired") acc.expired += 1;
        if (status === "renewal") acc.renewal += 1;
        if (status === "valid") acc.valid += 1;
        return acc;
      },
      { expired: 0, renewal: 0, valid: 0 }
    );
  }, [rows]);

  const allSelected = filteredRows.length > 0 && filteredRows.every((row) => selectedIds.includes(row.id));
  const selectedRows = filteredRows.filter((row) => selectedIds.includes(row.id));

  const mapExportRows = (items: TExpiryDocumentItem[]) =>
    items.map((item) => ({
      Entity: item.entity?.name || "",
      EntityType: item.entity?.entityType || "",
      DocumentName: item.name || "",
      ExpiryDate: formatDate(item.expiryDate || null),
      DaysLeft: item.daysLeft ?? "",
      Status: item.status || calculateStatus(item.expiryDate || ""),
      Notes: item.notes || "",
    }));

  const exportRows = async (
    format: "csv" | "excel" | "pdf",
    mode: "selected" | "all"
  ) => {
    const sourceRows = mode === "selected" ? selectedRows : filteredRows;
    const rowsForExport = mapExportRows(sourceRows);

    if (!rowsForExport.length) {
      toast.error(mode === "selected" ? "Select rows first" : "No rows to export");
      return;
    }

    if (format === "csv") {
      exportRowsCsv(rowsForExport, "expiry-documents");
    } else if (format === "excel") {
      exportRowsExcel(rowsForExport, "expiry-documents");
    } else {
      await exportRowsPdf(rowsForExport, "expiry-documents");
    }

    toast.success(`${mode === "selected" ? "Selected" : "Visible"} rows exported as ${format.toUpperCase()}`);
  };

  return (
    <>
      <Breadcrumb pageName="Expiry Documents" />

      <section className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-5 shadow-sm dark:border-amber-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-rose-300/20 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-300">
              <FiAlertCircle />
              Expiry Monitor
            </p>
            <h2 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              Document Expiry Control
            </h2>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-rose-200/70 bg-white/80 p-4 dark:border-rose-800/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Expired</p>
            <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">{statusCounts.expired}</p>
          </div>
          <div className="rounded-2xl border border-amber-200/70 bg-white/80 p-4 dark:border-amber-800/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Renewal</p>
            <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">{statusCounts.renewal}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/70 bg-white/80 p-4 dark:border-emerald-800/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Valid</p>
            <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{statusCounts.valid}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{rows.length}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
            <FiFileText className="text-slate-500" />
            Expiry Documents List
          </h3>

          <div className="flex items-center gap-2">
            <FiCalendar className="text-slate-400" />
            <select
              title="Filter expiry documents by name"
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All documents</option>
              <option value="unnamed">Unnamed</option>
              {documentNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <select
              title="Rows per page"
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(PAGINATION.DEFAULT_PAGE);
                setSelectedIds([]);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value={10}>Show 10</option>
              <option value={20}>Show 20</option>
              <option value={30}>Show 30</option>
              <option value={50}>Show 50</option>
              <option value={100}>Show 100</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportRows("csv", "selected")}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FiDownload /> CSV Selected
            </button>
            <button
              type="button"
              onClick={() => exportRows("excel", "selected")}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FiDownload /> Excel Selected
            </button>
            <button
              type="button"
              onClick={() => exportRows("pdf", "selected")}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FiDownload /> PDF Selected
            </button>
            <button
              type="button"
              onClick={() => exportRows("csv", "all")}
              className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-cyan-700"
            >
              <FiDownload /> CSV All
            </button>
            <button
              type="button"
              onClick={() => exportRows("excel", "all")}
              className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-cyan-700"
            >
              <FiDownload /> Excel All
            </button>
            <button
              type="button"
              onClick={() => exportRows("pdf", "all")}
              className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-cyan-700"
            >
              <FiDownload /> PDF All
            </button>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
          ) : isError ? (
            <div className="py-10 text-center text-sm text-rose-600 dark:text-rose-400">
              Failed to load expiry documents. Please refresh the page.
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-600 dark:text-slate-400">
              No expiry documents found.
            </div>
          ) : (
            <>
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 dark:bg-slate-800/40">
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="px-3 pb-3">
                      <input
                        type="checkbox"
                        aria-label="Select all expiry rows"
                        checked={allSelected}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setSelectedIds(filteredRows.map((row) => row.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                    </th>
                    <th className="min-w-[220px] pb-3 pl-4">Entity</th>
                    <th className="min-w-[220px] px-4 pb-3">Document</th>
                    <th className="min-w-[150px] px-4 pb-3">Expiry Date</th>
                    <th className="min-w-[100px] px-4 pb-3">Days Left</th>
                    <th className="min-w-[120px] px-4 pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((item) => {
                    const status =
                      item.status || calculateStatus(item.expiryDate || "");
                    const daysLeft = item.daysLeft;
                    const entityName = item.entity?.name || "Unknown";
                    const entityType = item.entity?.entityType || "unknown";
                    const entityId = item.entity?.id;
                    const isCompanyRow = entityType === "company" && Boolean(entityId);
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 transition-colors last:border-0 hover:bg-amber-50/40 dark:border-slate-800 dark:hover:bg-amber-500/5"
                      >
                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            aria-label={`Select ${item.name || item.id}`}
                            checked={selectedIds.includes(item.id)}
                            onChange={(event) => {
                              setSelectedIds((prev) =>
                                event.target.checked
                                  ? Array.from(new Set([...prev, item.id]))
                                  : prev.filter((id) => id !== item.id)
                              );
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                          />
                        </td>
                        <td className="py-4 pl-4">
                          <div className="flex items-center gap-3">
                            <EntityAvatar name={entityName} color={item.entity?.color} size="sm" />
                            <div className="flex flex-col">
                              {isCompanyRow ? (
                                <Link
                                  href={`/company/${entityId}`}
                                  className="font-semibold capitalize text-primary hover:underline"
                                >
                                  {entityName}
                                </Link>
                              ) : (
                                <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                                  {entityName}
                                </span>
                              )}
                              <span className="text-xs uppercase text-slate-500 dark:text-slate-400">
                                {entityType}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {item.name || "---"}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {formatDate(item.expiryDate || null)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={clsx(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                              daysLeft === null
                                ? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-400/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20"
                                : daysLeft < 0
                                  ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20"
                                  : daysLeft <= 30
                                    ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
                                    : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
                            )}
                          >
                            {daysLeft === null ? "---" : daysLeft}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={clsx(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                              status === "valid"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
                                : status === "expired"
                                  ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20"
                                  : status === "renewal"
                                    ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
                                    : "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20",
                            )}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 flex items-center justify-between px-2 pb-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {pagination?.total || 0} documents. Page{" "}
                  {pagination?.page || 1} of {pagination?.totalPages || 1}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={!pagination || pagination.page <= 1}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={
                      !pagination || pagination.page >= pagination.totalPages
                    }
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default ExpiryDocumentsPage;
