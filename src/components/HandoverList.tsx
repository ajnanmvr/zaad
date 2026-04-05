"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchHandovers } from "@/libs/queries";
import { TPhysicalHandover, TPaginatedResponse } from "@/types/types";
import formatDateTime from "@/utils/formatDateTime";
import { FiClock, FiRotateCcw, FiTrash2, FiPlus, FiFileText, FiCheckCircle } from "react-icons/fi";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useState } from "react";
import AddHandoverModal from "./Modals/AddHandoverModal";
import UsernameWithIcon from "./common/UsernameWithIcon";
import ConfirmationModal from "./Modals/ConfirmationModal";
import InputPromptModal from "./Modals/InputPromptModal";

interface HandoverListProps {
  entityId: string;
  entityName: string;
  entityType: string;
  compact?: boolean;
}

const HandoverList = ({ entityId, entityName, entityType, compact = false }: HandoverListProps) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [returnModal, setReturnModal] = useState<{ id: string; note: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<TPaginatedResponse<TPhysicalHandover>>({
    queryKey: ["handovers", "entity", entityId],
    queryFn: () => fetchHandovers(1, 100, undefined, entityId),
  });

  const returnMutation = useMutation({
    mutationFn: ({ id, returnNote }: { id: string; returnNote?: string }) =>
      axios.patch(`/api/documents/handover/${id}`, { action: "return", returnNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handovers"] });
      toast.success("Document marked as returned");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/documents/handover/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handovers"] });
      toast.success("Record deleted");
    },
  });

  const rows = data?.data || [];
  const returnedCount = rows.filter((item) => Boolean(item.returnedAt)).length;
  const pendingCount = rows.length - returnedCount;

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    deleteMutation.mutate(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  return (
    <div
      className={
        compact
          ? "space-y-3"
          : "relative mt-8 overflow-hidden rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-5 shadow-sm dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20 sm:p-6"
      }
    >
      {!compact && <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />}
      {!compact && <div className="pointer-events-none absolute -bottom-20 -left-8 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" />}

      <div className={compact ? "flex flex-wrap items-center justify-end gap-3" : "relative flex flex-wrap items-center justify-between gap-3"}>
        {!compact && (
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300">
              <FiFileText />
              Submission Tracker
            </p>
            <h3 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              Physical Document Handover
            </h3>
          </div>
        )}

        <button
          onClick={() => setShowAddModal(true)}
          className={
            compact
              ? "inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              : "inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          }
        >
          <FiPlus className="text-lg" />
          Record Submission
        </button>
      </div>

      {!compact && (
        <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Records</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{rows.length}</p>
          </div>
          <div className="rounded-2xl border border-amber-200/80 bg-white/80 p-4 dark:border-amber-800/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pending</p>
            <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/80 bg-white/80 p-4 dark:border-emerald-800/40 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Returned</p>
            <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">{returnedCount}</p>
          </div>
        </div>
      )}

      <AddHandoverModal
        isOpen={showAddModal}
        onSuccess={() => {
          setShowAddModal(false);
          queryClient.invalidateQueries({ queryKey: ["handovers"] });
        }}
        onCancel={() => setShowAddModal(false)}
        initialEntity={{ id: entityId, name: entityName, type: entityType }}
      />

      <InputPromptModal
        isOpen={Boolean(returnModal)}
        title="Return Document"
        message="Add a return note (optional)"
        value={returnModal?.note || ""}
        placeholder="Reason, condition, or handover context"
        confirmLabel="Mark Returned"
        onChange={(value) => {
          setReturnModal((prev) => (prev ? { ...prev, note: value } : prev));
        }}
        onCancel={() => setReturnModal(null)}
        onConfirm={() => {
          if (!returnModal) return;
          returnMutation.mutate({
            id: returnModal.id,
            returnNote: returnModal.note.trim() || undefined,
          });
          setReturnModal(null);
        }}
        isLoading={returnMutation.isPending}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteConfirmId)}
        title="Delete Handover Record"
        message="Are you sure you want to delete this handover record?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onCancel={() => {
          if (!deleteMutation.isPending) {
            setDeleteConfirmId(null);
          }
        }}
        onConfirm={confirmDelete}
      />

      <div
        className={
          compact
            ? "overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80"
            : "relative mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white/85 dark:border-slate-800 dark:bg-slate-900/80"
        }
      >
        {isLoading ? (
          <div className="flex justify-center py-14">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>
        ) : rows.length === 0 ? (
          <div className="m-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-sm font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-500">
            <FiFileText className="text-3xl opacity-30" />
            <p>No physical documents recorded for this entity.</p>
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:border-slate-800">
                  <th className="pb-3 pl-4 pt-3">Document</th>
                  <th className="px-4 pb-3 pt-3">Received Date</th>
                  <th className="px-4 pb-3 pt-3">Received By</th>
                  <th className="px-4 pb-3 pt-3">Returned Status</th>
                  <th className="px-4 pb-3 pt-3">Returned By</th>
                  <th className="px-4 pb-3 pt-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {rows.map((item) => (
                  <tr key={item.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-4 pl-4 text-sm">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{item.documentName}</span>
                        {(item.receiveNote || item.remarks) && (
                          <span className="mt-1 text-xs text-slate-400">{item.receiveNote || item.remarks}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <FiClock className="opacity-50" />
                        {formatDateTime(item.receivedAt?.toString())}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400">
                      <UsernameWithIcon
                        username={item.receivedBy?.username}
                        fullname={item.receivedBy?.fullname}
                      />
                    </td>
                    <td className="px-4 py-4 text-xs font-medium">
                      {item.returnedAt ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <FiCheckCircle />
                            RETURNED
                          </span>
                          <span className="ml-1 text-[10px] text-slate-400">{formatDateTime(item.returnedAt.toString())}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400">
                      <UsernameWithIcon
                        username={item.returnedBy?.username}
                        fullname={item.returnedBy?.fullname}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                        {item.status !== "returned" && (
                          <button
                            title="Mark Returned"
                            onClick={() => {
                              setReturnModal({ id: item.id, note: item.returnNote || "" });
                            }}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                          >
                            <FiRotateCcw className="text-lg" />
                          </button>
                        )}
                        <button
                          title="Delete Record"
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                        >
                          <FiTrash2 className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HandoverList;
