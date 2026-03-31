"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchHandovers } from "@/libs/queries";
import { TPhysicalHandover, TPaginatedResponse } from "@/types/types";
import formatDateTime from "@/utils/formatDateTime";
import { FiClock, FiRotateCcw, FiTrash2, FiPlus, FiFileText } from "react-icons/fi";
import axios from "axios";
import { toast } from "react-hot-toast";
import React, { useState } from "react";
import AddHandoverModal from "./Modals/AddHandoverModal";

interface HandoverListProps {
  entityId: string;
  entityName: string;
  entityType: string;
}

const HandoverList = ({ entityId, entityName, entityType }: HandoverListProps) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<TPaginatedResponse<TPhysicalHandover>>({
    queryKey: ["handovers", "entity", entityId],
    queryFn: () => fetchHandovers(1, 100, undefined, entityId),
  });

  const returnMutation = useMutation({
    mutationFn: (id: string) => 
      axios.patch(`/api/documents/handover/${id}`, { action: "return" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handovers"] });
      toast.success("Document marked as returned");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      axios.delete(`/api/documents/handover/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handovers"] });
      toast.success("Record deleted");
    },
  });

  const rows = data?.data || [];

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <FiFileText className="text-primary opacity-70" />
          Physical Document Handover
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-opacity-90 shadow-md"
        >
          <FiPlus className="text-lg" />
          Record Submission
        </button>
      </div>

      <AddHandoverModal
        isOpen={showAddModal}
        onSuccess={() => {
          setShowAddModal(false);
          queryClient.invalidateQueries({ queryKey: ["handovers"] });
        }}
        onCancel={() => setShowAddModal(false)}
        initialEntity={{ id: entityId, name: entityName, type: entityType }}
      />

      <div className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm font-medium text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center gap-2">
             <FiFileText className="text-3xl opacity-30" />
             <p>No physical documents recorded for this entity.</p>
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="pb-3 pl-2 pt-2">Document</th>
                  <th className="px-4 pb-3 pt-2">Received Date</th>
                  <th className="px-4 pb-3 pt-2">Returned Status</th>
                  <th className="px-4 pb-3 pt-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {rows.map((item) => (
                  <tr key={item.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-4 pl-2 text-sm">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{item.documentName}</span>
                        {item.remarks && <span className="text-xs text-slate-400 mt-1">{item.remarks}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <FiClock className="opacity-50" />
                        {formatDateTime(item.receivedAt?.toString())}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium">
                      {item.returnedAt ? (
                        <div className="flex flex-col gap-0.5">
                           <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                             RETURNED
                           </span>
                           <span className="text-[10px] text-slate-400 ml-1">
                             {formatDateTime(item.returnedAt.toString())}
                           </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {item.status !== "returned" && (
                          <button
                            title="Mark Returned"
                            onClick={() => returnMutation.mutate(item.id)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                          >
                            <FiRotateCcw className="text-lg" />
                          </button>
                        )}
                        <button
                          title="Delete Record"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this record?")) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
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
