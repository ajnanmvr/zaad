"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { FiChevronDown, FiDownload } from "react-icons/fi";

type ExportFormat = "csv" | "excel" | "pdf";
type ExportMode = "selected" | "all";

type ExportActionsMenuProps = {
  onExport: (format: ExportFormat, mode: ExportMode) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
};

const optionGroups: Array<{ label: string; options: Array<{ label: string; format: ExportFormat; mode: ExportMode }> }> = [
  {
    label: "Selected rows",
    options: [
      { label: "CSV Selected", format: "csv", mode: "selected" },
      { label: "Excel Selected", format: "excel", mode: "selected" },
      { label: "PDF Selected", format: "pdf", mode: "selected" },
    ],
  },
  {
    label: "All rows",
    options: [
      { label: "CSV All", format: "csv", mode: "all" },
      { label: "Excel All", format: "excel", mode: "all" },
      { label: "PDF All", format: "pdf", mode: "all" },
    ],
  },
];

export default function ExportActionsMenu({ onExport, disabled, className }: ExportActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = useMemo(() => optionGroups, []);

  return (
    <div className={clsx("relative z-50 inline-flex", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FiDownload />
        Download
        <FiChevronDown className={clsx("transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-[60] mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {menuItems.map((group) => (
            <div key={group.label} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
              <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </div>
              {group.options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={async () => {
                    setIsOpen(false);
                    await onExport(option.format, option.mode);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {option.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}