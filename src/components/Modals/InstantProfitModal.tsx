"use client";

import InstantProfitForm from "@/components/Forms/InstantProfitForm";

interface InstantProfitModalProps {
  isOpen: boolean;
  onCancel: () => void;
}

const InstantProfitModal = ({ isOpen, onCancel }: InstantProfitModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-10 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-2xl dark:border-violet-900/40 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-violet-200/70 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-5 py-4 dark:border-violet-900/30 dark:from-slate-900 dark:to-slate-900 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
              Special Entry
            </p>
            <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              Instant Profit
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-violet-300 px-3 py-2 text-xs font-bold uppercase tracking-wider text-violet-700 transition hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/30"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto p-4 sm:p-6">
          <InstantProfitForm />
        </div>
      </div>
    </div>
  );
};

export default InstantProfitModal;
