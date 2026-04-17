"use client";

import AddRecord from "@/components/Forms/AddRecord";

interface InstantProfitModalProps {
  isOpen: boolean;
  onCancel: () => void;
}

const InstantProfitModal = ({ isOpen, onCancel }: InstantProfitModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-10 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">
              Special Entry
            </p>
            <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              Instant Profit
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto p-4 sm:p-6">
          <AddRecord
            type="income"
            hideBreadcrumb
            showSpecialModes
            forceRecordKind="instant_profit"
            initialMode="instant-profit"
            submitEndpoint="/api/payment/profit"
            suggestionCategory="instant_profit"
          />
        </div>
      </div>
    </div>
  );
};

export default InstantProfitModal;
