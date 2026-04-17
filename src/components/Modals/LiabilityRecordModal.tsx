"use client";

import AddRecord from "@/components/Forms/AddRecord";

interface LiabilityRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badgeLabel: string;
  type: "income" | "expense";
  suggestionCategory: "liability_in" | "liability_out";
}

const LiabilityRecordModal = ({
  isOpen,
  onClose,
  title,
  badgeLabel,
  type,
  suggestionCategory,
}: LiabilityRecordModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-10 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-2xl dark:border-orange-900/40 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-orange-200/70 bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-4 dark:border-orange-900/30 dark:from-slate-900 dark:to-slate-900 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600 dark:text-orange-300">
              {badgeLabel}
            </p>
            <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-orange-300 px-3 py-2 text-xs font-bold uppercase tracking-wider text-orange-700 transition hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/30"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto p-4 sm:p-6">
          <AddRecord
            type={type}
            suggestionCategory={suggestionCategory}
            forceRecordKind="liability"
            hidePaymentStatus
            hideBreadcrumb
          />
        </div>
      </div>
    </div>
  );
};

export default LiabilityRecordModal;