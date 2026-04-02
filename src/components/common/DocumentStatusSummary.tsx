import { FiAlertCircle, FiCheckCircle, FiClock } from "react-icons/fi";

type TDocumentStatusCounts = {
  expired: number;
  renewal: number;
  valid: number;
};

function DocumentStatusSummary({
  counts,
}: {
  counts?: TDocumentStatusCounts;
}) {
  const expired = counts?.expired ?? 0;
  const renewal = counts?.renewal ?? 0;
  const valid = counts?.valid ?? 0;
  const total = expired + renewal + valid;

  if (total === 0) {
    return (
      <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        No docs
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {expired > 0 && (
        <span className="inline-flex items-center rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30">
          <FiAlertCircle className="mr-1" />
          {expired}
        </span>
      )}
      {renewal > 0 && (
        <span className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
          <FiClock className="mr-1" />
          {renewal}
        </span>
      )}
      {valid > 0 && (
        <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
          <FiCheckCircle className="mr-1" />
          {valid}
        </span>
      )}
    </div>
  );
}

export default DocumentStatusSummary;
