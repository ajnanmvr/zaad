"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import clsx from "clsx";
import {
  FiTrash2,
  FiEdit2,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiCalendar,
  FiAlertCircle,
} from "react-icons/fi";
import { formatDate } from "./EntityProfileFrame";
import calculateStatus from "@/utils/calculateStatus";
import calculateDaysLeft from "@/utils/calculateDaysLeft";

interface Document {
  _id: string;
  documentTemplate?: string;
  name?: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
  status?: "valid" | "expired" | "renewal" | "unknown";
  suppressWarning?: boolean;
}

interface DocumentManagementCardProps {
  document: Document;
  entityType: string;
  entityId: string;
  onUpdate: () => void;
}

export default function DocumentManagementCard({
  document,
  entityType,
  entityId,
  onUpdate,
}: DocumentManagementCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [suppressWarning, setSuppressWarning] = useState(document.suppressWarning ?? false);
  const [newExpiryDate, setNewExpiryDate] = useState(document.expiryDate || "");

  const daysLeft = calculateDaysLeft(document.expiryDate);
  const status = document.status || calculateStatus(document.expiryDate || "");

  const statusStyles = {
    expired: "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30",
    renewal: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30",
    valid: "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30",
    unknown: "bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:border-slate-500/30",
  };

  const statusIconColor = {
    expired: "text-rose-600 dark:text-rose-400",
    renewal: "text-amber-600 dark:text-amber-400",
    valid: "text-emerald-600 dark:text-emerald-400",
    unknown: "text-slate-600 dark:text-slate-400",
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      toast.error("Click delete again to confirm");
      return;
    }

    try {
      setIsDeleting(true);
      await axios.delete(`/api/${entityType}/${entityId}/doc/${document._id}`);
      toast.success("Document deleted successfully");
      onUpdate();
    } catch (error) {
      toast.error("Failed to delete document");
      console.error(error);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleRenew = async () => {
    if (!newExpiryDate) {
      toast.error("Please select a new expiry date");
      return;
    }

    try {
      setIsRenewing(true);
      await axios.put(`/api/${entityType}/${entityId}/doc/${document._id}`, {
        documentTemplate: document.documentTemplate,
        issueDate: document.issueDate,
        expiryDate: newExpiryDate,
        notes: document.notes,
      });
      toast.success("Document renewed successfully");
      setIsRenewing(false);
      onUpdate();
    } catch (error) {
      toast.error("Failed to renew document");
      console.error(error);
      setIsRenewing(false);
    }
  };

  const toggleSuppressWarning = () => {
    setSuppressWarning(!suppressWarning);
    toast.success(
      suppressWarning
        ? "Warning will be shown for this document"
        : "Warning suppressed for this document (renewed by other providers)"
    );
  };

  return (
    <div
      className={clsx(
        "rounded-2xl border-2 p-4 transition-all duration-200",
        statusStyles[status]
      )}
    >
      {/* Header with status and actions */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={clsx("mt-1 rounded-lg p-2", statusIconColor[status])}>
            <FiAlertCircle className="text-lg" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {document.name || "Untitled document"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {document.issueDate && `Issued: ${formatDate(document.issueDate)}`}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {status === "renewal" && (
            <button
              onClick={() => setIsRenewing(!isRenewing)}
              className="rounded-lg bg-white p-2 text-emerald-600 shadow-sm transition hover:bg-emerald-50 dark:bg-slate-700 dark:text-emerald-400 dark:hover:bg-slate-600"
              title="Renew document"
            >
              <FiRefreshCw className="text-lg" />
            </button>
          )}

          <button
            onClick={toggleSuppressWarning}
            className={clsx(
              "rounded-lg p-2 shadow-sm transition",
              suppressWarning
                ? "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
                : "bg-white text-amber-600 hover:bg-amber-50 dark:bg-slate-700 dark:text-amber-400 dark:hover:bg-slate-600"
            )}
            title={suppressWarning ? "Show warning" : "Suppress warning"}
          >
            {suppressWarning ? (
              <FiEyeOff className="text-lg" />
            ) : (
              <FiEye className="text-lg" />
            )}
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-lg bg-white p-2 text-blue-600 shadow-sm transition hover:bg-blue-50 dark:bg-slate-700 dark:text-blue-400 dark:hover:bg-slate-600"
            title="Edit document"
          >
            <FiEdit2 className="text-lg" />
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={clsx(
              "rounded-lg bg-white p-2 shadow-sm transition disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600",
              deleteConfirm ? "text-rose-700 hover:bg-rose-100 dark:text-rose-300" : "text-rose-600 hover:bg-rose-50 dark:text-rose-400",
            )}
            title={deleteConfirm ? "Click again to confirm deletion" : "Delete document"}
          >
            <FiTrash2 className="text-lg" />
          </button>
        </div>
      </div>

      {/* Expiry info */}
      <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/40 px-3 py-2 dark:bg-slate-800/30">
        <FiCalendar className="text-slate-500 dark:text-slate-400" />
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Expiry Date
          </p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {formatDate(document.expiryDate)}
            {daysLeft !== null && (
              <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                ({daysLeft > 0 ? `${daysLeft} days left` : "Expired"})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Notes */}
      {document.notes && (
        <div className="mb-3 rounded-lg bg-white/40 px-3 py-2 dark:bg-slate-800/30">
          <p className="text-xs text-slate-600 dark:text-slate-400">{document.notes}</p>
        </div>
      )}

      {/* Renew form */}
      {isRenewing && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
              New Expiry Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRenew}
              disabled={isRenewing || !newExpiryDate}
              className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {isRenewing ? "Renewing..." : "Renew"}
            </button>
            <button
              onClick={() => setIsRenewing(false)}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Warning suppression indicator */}
      {suppressWarning && (
        <div className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-700/50 dark:text-slate-400">
          ⚠️ Warning suppressed (document renewed by other providers)
        </div>
      )}
    </div>
  );
}
