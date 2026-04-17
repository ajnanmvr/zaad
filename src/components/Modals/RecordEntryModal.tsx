"use client";

import clsx from "clsx";

import AddRecord from "@/components/Forms/AddRecord";

type Tone = "emerald" | "rose" | "cyan" | "orange" | "violet";

const toneStyles: Record<
  Tone,
  {
    shell: string;
    badge: string;
    close: string;
  }
> = {
  emerald: {
    shell:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-900/40 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/30",
    badge:
      "border border-emerald-300/60 bg-emerald-100/80 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/40 dark:text-emerald-300",
    close:
      "border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/40",
  },
  rose: {
    shell:
      "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:border-rose-900/40 dark:from-slate-950 dark:via-slate-950 dark:to-rose-950/30",
    badge:
      "border border-rose-300/60 bg-rose-100/80 text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/40 dark:text-rose-300",
    close:
      "border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/40",
  },
  cyan: {
    shell:
      "border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50 dark:border-cyan-900/40 dark:from-slate-950 dark:via-slate-950 dark:to-cyan-950/30",
    badge:
      "border border-cyan-300/60 bg-cyan-100/80 text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/40 dark:text-cyan-300",
    close:
      "border-cyan-300 text-cyan-700 hover:bg-cyan-100 dark:border-cyan-700 dark:text-cyan-300 dark:hover:bg-cyan-900/40",
  },
  orange: {
    shell:
      "border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:border-orange-900/40 dark:from-slate-950 dark:via-slate-950 dark:to-orange-950/30",
    badge:
      "border border-orange-300/60 bg-orange-100/80 text-orange-700 dark:border-orange-700/40 dark:bg-orange-900/40 dark:text-orange-300",
    close:
      "border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/40",
  },
  violet: {
    shell:
      "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:border-violet-900/40 dark:from-slate-950 dark:via-slate-950 dark:to-violet-950/30",
    badge:
      "border border-violet-300/60 bg-violet-100/80 text-violet-700 dark:border-violet-700/40 dark:bg-violet-900/40 dark:text-violet-300",
    close:
      "border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/40",
  },
};

type AddRecordProps = React.ComponentProps<typeof AddRecord>;

interface RecordEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  badgeLabel: string;
  title: string;
  tone: Tone;
  addRecordProps: AddRecordProps;
}

const RecordEntryModal = ({
  isOpen,
  onClose,
  badgeLabel,
  title,
  tone,
  addRecordProps,
}: RecordEntryModalProps) => {
  if (!isOpen) {
    return null;
  }

  const styles = toneStyles[tone];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-10 backdrop-blur-sm">
      <div
        className={clsx(
          "w-full max-w-5xl overflow-hidden rounded-3xl border shadow-2xl",
          styles.shell,
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div>
            <p
              className={clsx(
                "inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em]",
                styles.badge,
              )}
            >
              {badgeLabel}
            </p>
            <h3 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={clsx(
              "rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition",
              styles.close,
            )}
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto p-4 sm:p-6">
          <AddRecord {...addRecordProps} hideBreadcrumb />
        </div>
      </div>
    </div>
  );
};

export default RecordEntryModal;