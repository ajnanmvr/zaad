"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiX, FiDownload, FiCalendar } from "react-icons/fi";

type Props = {
  entityType: "company" | "employee" | "individual";
  entityId: string;
  onClose: () => void;
};

export default function SOAModal({ entityType, entityId, onClose }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"all" | "custom">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function handleView() {
    const base = `/accounts/soa/${entityType}/${entityId}`;
    if (mode === "custom" && dateFrom && dateTo) {
      router.push(`${base}?from=${dateFrom}&to=${dateTo}`);
    } else {
      router.push(base);
    }
    onClose();
  }

  const isValid = mode === "all" || (Boolean(dateFrom) && Boolean(dateTo) && dateFrom <= dateTo);

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FiDownload size={15} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Statement of Account
              </h2>
              <p className="text-[11px] text-slate-400">Choose period</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Mode toggles */}
          <div className="flex rounded-xl border border-slate-200 p-1 gap-1 dark:border-slate-700">
            {(["all", "custom"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  mode === m
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {m === "all" ? "All Time" : "Custom Range"}
              </button>
            ))}
          </div>

          {/* Date pickers */}
          {mode === "custom" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <FiCalendar size={11} /> From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <FiCalendar size={11} /> To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              {dateFrom && dateTo && dateFrom > dateTo && (
                <p className="text-xs text-red-500">&ldquo;To&rdquo; date must be after &ldquo;From&rdquo; date.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <button
            disabled={!isValid}
            onClick={handleView}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiDownload size={14} />
            View Statement
          </button>
        </div>
      </div>
    </div>
  );
}
