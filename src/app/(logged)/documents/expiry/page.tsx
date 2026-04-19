"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { fetchExpiryDocuments } from "@/libs/queries";
import { TExpiryDocumentItem, TPaginatedResponse } from "@/types/types";
import calculateStatus from "@/utils/calculateStatus";
import formatDate from "@/utils/formatDate";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";
import clsx from "clsx";
import { PAGINATION } from "@/config/pagination";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FiAlertCircle, FiArchive, FiCalendar, FiCheckSquare, FiEdit2, FiFileText, FiPlus, FiTrash2 } from "react-icons/fi";
import EntityAvatar from "@/components/common/EntityAvatar";
import ExportActionsMenu from "@/components/common/ExportActionsMenu";
import { exportRowsCsv, exportRowsExcel, exportRowsPdf } from "@/utils/exportTableData";
import { toast } from "react-hot-toast";
import AddExpiryDocumentModal from "@/components/Modals/AddExpiryDocumentModal";
import { resolveAvatarColorWithFallback } from "@/components/entity/EntityProfileFrame";
import {
  getDocumentCategoryIcon,
  getDocumentCategoryLabel,
} from "@/config/documentCategoryVisuals";

function formatRelativeExpiry(daysLeft: number | null) {
  if (daysLeft === null) {
    return "---";
  }

  const absDays = Math.abs(daysLeft);
  const years = Math.floor(absDays / 365);
  const months = Math.floor(absDays / 30);

  const suffix = daysLeft >= 0 ? "left" : "ago";

  if (years >= 1) {
    return `${years} year${years === 1 ? "" : "s"} ${suffix}`;
  }

  if (months >= 1) {
    return `${months} month${months === 1 ? "" : "s"} ${suffix}`;
  }

  return `${absDays} day${absDays === 1 ? "" : "s"} ${suffix}`;
}

function getEntityHref(entityId?: string, entityType?: string) {
  if (!entityId || !entityType) {
    return null;
  }

  if (entityType === "company" || entityType === "employee" || entityType === "individual") {
    return `/${entityType}/${entityId}`;
  }

  return null;
}

const ExpiryDocumentsPage = () => {
  const archiveNoteSuggestions = [
    "Renewed by another provider",
    "No longer interested to renew",
    "Entity closed / inactive",
    "Merged into another document",
  ];

  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [limit, setLimit] = useState<number>(PAGINATION.LIMITS.EXPIRY_DOCUMENTS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [archivingDocumentId, setArchivingDocumentId] = useState<string | null>(null);
  const [archiveNotesDraft, setArchiveNotesDraft] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
  const [editDraft, setEditDraft] = useState({ expiryDate: "", notes: "" });

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

  const isDocumentFiltered = nameFilter !== "all";
  const activeDocumentLabel = nameFilter === "unnamed" ? "Unnamed" : nameFilter;

  const statusCounts = useMemo(() => {
    return filteredRows.reduce(
      (acc, item) => {
        const status = item.status || calculateStatus(item.expiryDate || "");
        if (status === "expired") acc.expired += 1;
        if (status === "renewal") acc.renewal += 1;
        if (status === "valid") acc.valid += 1;
        return acc;
      },
      { expired: 0, renewal: 0, valid: 0 }
    );
  }, [filteredRows]);

  const allSelected = filteredRows.length > 0 && filteredRows.every((row) => selectedIds.includes(row.id));
  const selectedRows = filteredRows.filter((row) => selectedIds.includes(row.id));

  const mapExportRows = (items: TExpiryDocumentItem[]) =>
    items.map((item) => ({
      Entity: item.entity?.name || "",
      EntityType: item.entity?.entityType || "",
      DocumentName: item.name || "",
      DocumentCategory: getDocumentCategoryLabel(item.templateCategory),
      ExpiryDate: formatDate(item.expiryDate || null),
      DaysLeft: formatRelativeExpiry(item.daysLeft),
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

  const startEditDocument = (item: TExpiryDocumentItem) => {
    setEditingDocumentId(item.id);
    setEditDraft({
      expiryDate: item.expiryDate || "",
      notes: item.notes || "",
    });
  };

  const cancelEditDocument = () => {
    setEditingDocumentId(null);
    setEditDraft({ expiryDate: "", notes: "" });
  };

  const startArchiveDocument = (item: TExpiryDocumentItem) => {
    setArchivingDocumentId(item.id);
    setArchiveNotesDraft(item.archiveNotes || "");
  };

  const cancelArchiveDocument = () => {
    setArchivingDocumentId(null);
    setArchiveNotesDraft("");
  };

  const saveEditDocument = async (item: TExpiryDocumentItem) => {
    if (!editDraft.expiryDate) {
      toast.error("Please choose an expiry date");
      return;
    }

    try {
      await axios.put(`/api/${item.entity.entityType}/${item.entity.id}/doc/${item.id}`, {
        documentTemplate: item.documentTemplate,
        issueDate: item.issueDate,
        expiryDate: editDraft.expiryDate,
        notes: editDraft.notes || undefined,
      });
      toast.success("Document updated successfully");
      cancelEditDocument();
      await queryClient.invalidateQueries({ queryKey: ["expiry-documents"] });
    } catch (error) {
      toast.error("Failed to update document");
      console.error(error);
    }
  };

  const deleteDocument = async (item: TExpiryDocumentItem) => {
    if (deleteConfirmId !== item.id) {
      setDeleteConfirmId(item.id);
      toast.error("Click delete again to confirm");
      return;
    }

    try {
      await axios.delete(`/api/${item.entity.entityType}/${item.entity.id}/doc/${item.id}`);
      toast.success("Document deleted successfully");
      setDeleteConfirmId(null);
      if (editingDocumentId === item.id) {
        cancelEditDocument();
      }
      await queryClient.invalidateQueries({ queryKey: ["expiry-documents"] });
    } catch (error) {
      toast.error("Failed to delete document");
      console.error(error);
    }
  };

  const archiveDocument = async (item: TExpiryDocumentItem) => {
    try {
      setIsArchiving(true);
      await axios.put(`/api/documents/archive/${item.id}`, {
        archiveNotes: archiveNotesDraft || undefined,
      });

      toast.success("Document archived");
      setSelectedIds((prev) => prev.filter((id) => id !== item.id));
      queryClient.setQueriesData(
        { queryKey: ["expiry-documents"] },
        (previous: TPaginatedResponse<TExpiryDocumentItem> | undefined) => {
          if (!previous) {
            return previous;
          }

          const nextData = previous.data.filter((row) => row.id !== item.id);
          const nextTotal = Math.max((previous.pagination?.total || 0) - 1, 0);

          return {
            ...previous,
            data: nextData,
            pagination: {
              ...previous.pagination,
              total: nextTotal,
              totalPages: Math.max(
                1,
                Math.ceil(nextTotal / (previous.pagination?.limit || limit || 1))
              ),
            },
          };
        }
      );
      cancelArchiveDocument();
      await queryClient.invalidateQueries({ queryKey: ["expiry-documents"] });
      await queryClient.invalidateQueries({ queryKey: ["archived-documents"] });
    } catch (error) {
      toast.error("Failed to archive document");
      console.error(error);
    } finally {
      setIsArchiving(false);
    }
  };

  const createTaskFromDocument = (item: TExpiryDocumentItem) => {
    const entityType = item.entity?.entityType || "";
    const entityId = item.entity?.id || "";
    const entityName = item.entity?.name || "";
    const documentTitle = item.name || "Untitled Document";
    const documentCategory = item.templateCategory || "";

    const params = new URLSearchParams({
      title: documentTitle,
      linkedEntity: `${entityType}:${entityId}:${entityName}`,
      category: documentCategory,
    });

    router.push(`/tasks?${params.toString()}`);
  };

  return (
    <div id="expiry-documents-report-root">
      <Breadcrumb pageName="Expiry Documents" />

      <AddExpiryDocumentModal
        isOpen={showAddDocument}
        onSuccess={() => {
          setShowAddDocument(false);
          void queryClient.invalidateQueries({ queryKey: ["expiry-documents"] });
        }}
        onCancel={() => setShowAddDocument(false)}
      />

      <section
        className={clsx(
          "relative overflow-visible rounded-3xl p-5 shadow-sm sm:p-6",
          isDocumentFiltered
            ? "border-2 border-amber-400/80 bg-gradient-to-br from-amber-100 via-amber-50 to-rose-50 dark:border-amber-600/70 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/30"
            : "border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-rose-50 dark:border-amber-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20",
        )}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-rose-300/20 blur-3xl" />

        <div className="relative z-20 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-300">
              <FiAlertCircle />
              Expiry Monitor
            </p>
            <h2 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              Document Expiry Control
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/documents/archived"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FiArchive className="text-base" />
              Archived Documents
            </Link>
            <button
              type="button"
              onClick={() => setShowAddDocument(true)}
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <FiPlus className="text-lg" />
              Add Expiry Document
            </button>
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
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{filteredRows.length}</p>
          </div>
        </div>

        {isDocumentFiltered && (
          <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-100/70 px-4 py-3 text-amber-900 dark:border-amber-700/70 dark:bg-amber-900/20 dark:text-amber-200">
            <p className="text-sm font-semibold">
              List filtered by document: <span className="rounded-md bg-white/80 px-2 py-1 font-black dark:bg-slate-900/60">{activeDocumentLabel}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setNameFilter("all");
                setPage(PAGINATION.DEFAULT_PAGE);
                setSelectedIds([]);
              }}
              className="rounded-lg border border-amber-400 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 transition hover:bg-white dark:border-amber-700 dark:bg-slate-900/50 dark:text-amber-200 dark:hover:bg-slate-900"
            >
              Clear Filter
            </button>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
            <FiFileText className="text-slate-500" />
            {isDocumentFiltered ? `Expiry Documents List - ${activeDocumentLabel}` : "Expiry Documents List"}
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

          <ExportActionsMenu onExport={exportRows} />
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
                    <th className="min-w-[240px] pb-3 pl-4">Document</th>
                    <th className="min-w-[220px] px-4 pb-3">Entity</th>
                    <th className="min-w-[150px] px-4 pb-3">Expiry Date</th>
                    <th className="min-w-[100px] px-4 pb-3">Days Left</th>
                    <th className="min-w-[120px] px-4 pb-3">Status</th>
                    <th className="min-w-[120px] px-4 pb-3 text-right">Actions</th>
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
                    const entityHref = getEntityHref(entityId, entityType);
                    const isEditing = editingDocumentId === item.id;
                    const documentAvatarColor = resolveAvatarColorWithFallback(
                      item.templateColor,
                      item.name || "Document",
                    );
                    const DocumentIcon = getDocumentCategoryIcon(item.templateCategory);

                    return (
                      <Fragment key={item.id}>
                      <tr
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
                            <span
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white"
                              style={{ backgroundColor: documentAvatarColor }}
                            >
                              <DocumentIcon />
                            </span>
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => {
                                  setNameFilter(item.name || "unnamed");
                                  setPage(PAGINATION.DEFAULT_PAGE);
                                  setSelectedIds([]);
                                }}
                                className="text-left text-sm font-bold text-primary hover:underline"
                                title="Show all entities with this document name"
                              >
                                {item.name || "Unnamed document"}
                              </button>
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {getDocumentCategoryLabel(item.templateCategory)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <EntityAvatar name={entityName} color={item.entity?.color} size="sm" />
                            <div className="flex flex-col">
                              {entityHref ? (
                                <Link
                                  href={entityHref}
                                  className="text-sm font-semibold capitalize text-primary hover:underline"
                                >
                                  {entityName}
                                </Link>
                              ) : (
                                <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
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
                            {formatRelativeExpiry(daysLeft)}
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
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEditDocument(item)}
                              className="rounded-lg border border-blue-300 p-2 text-blue-700 transition hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-500/10"
                              title="Edit document"
                            >
                              <FiEdit2 className="text-sm" />
                            </button>
                            <button
                              type="button"
                              onClick={() => createTaskFromDocument(item)}
                              className="rounded-lg border border-cyan-300 p-2 text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-300 dark:hover:bg-cyan-500/10"
                              title="Create task from this document"
                            >
                              <FiCheckSquare className="text-sm" />
                            </button>
                            <button
                              type="button"
                              onClick={() => startArchiveDocument(item)}
                              className="rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                              title="Archive document"
                            >
                              <FiArchive className="text-sm" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteDocument(item)}
                              className={clsx(
                                "rounded-lg border p-2 transition",
                                deleteConfirmId === item.id
                                  ? "border-rose-400 bg-rose-100 text-rose-700 dark:border-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
                                  : "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/10",
                              )}
                              title="Delete document"
                            >
                              <FiTrash2 className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isEditing && (
                        <tr className="border-b border-slate-100 bg-amber-50/30 dark:border-slate-800 dark:bg-amber-500/5">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid gap-3 rounded-2xl border border-amber-200 bg-white p-4 dark:border-amber-900/40 dark:bg-slate-900/60 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Expiry Date</label>
                                <input
                                  type="date"
                                  value={editDraft.expiryDate}
                                  onChange={(event) => setEditDraft((prev) => ({ ...prev, expiryDate: event.target.value }))}
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</label>
                                <textarea
                                  rows={3}
                                  value={editDraft.notes}
                                  onChange={(event) => setEditDraft((prev) => ({ ...prev, notes: event.target.value }))}
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                                />
                              </div>
                              <div className="sm:col-span-2 flex flex-wrap justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={cancelEditDocument}
                                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveEditDocument(item)}
                                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                                >
                                  Save Changes
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      {archivingDocumentId === item.id && (
                        <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/40">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                  Archive Notes (Reason)
                                </label>
                                <textarea
                                  rows={3}
                                  value={archiveNotesDraft}
                                  onChange={(event) => setArchiveNotesDraft(event.target.value)}
                                  placeholder="Reason for archiving this document"
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                                />
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {archiveNoteSuggestions.map((suggestion) => (
                                    <button
                                      key={suggestion}
                                      type="button"
                                      onClick={() => setArchiveNotesDraft(suggestion)}
                                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex flex-wrap justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={cancelArchiveDocument}
                                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => archiveDocument(item)}
                                  disabled={isArchiving}
                                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                >
                                  <FiArchive />
                                  {isArchiving ? "Archiving..." : "Archive Document"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
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
    </div>
  );
};

export default ExpiryDocumentsPage;
