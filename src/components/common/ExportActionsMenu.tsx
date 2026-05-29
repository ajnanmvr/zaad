"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { FiChevronDown, FiDownload } from "react-icons/fi";
import { FaFileCsv, FaFileExcel, FaFilePdf } from "react-icons/fa";

type ExportFormat = "csv" | "excel" | "pdf";
type ExportMode = "selected" | "all";

type ExportActionsMenuProps = {
  onExport: (format: ExportFormat, mode: ExportMode) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  iconOnly?: boolean;
  inlinePanel?: boolean;
  selectedCount?: number;
};

const optionGroups: Array<{ label: string; options: Array<{ label: string; format: ExportFormat; mode: ExportMode; icon: JSX.Element }> }> = [
  {
    label: "Selected rows",
    options: [
      { label: "CSV Selected", format: "csv", mode: "selected", icon: <FaFileCsv className="text-emerald-600 dark:text-emerald-400" /> },
      { label: "Excel Selected", format: "excel", mode: "selected", icon: <FaFileExcel className="text-green-700 dark:text-green-400" /> },
      { label: "PDF Selected", format: "pdf", mode: "selected", icon: <FaFilePdf className="text-rose-600 dark:text-rose-400" /> },
    ],
  },
  {
    label: "All rows",
    options: [
      { label: "CSV All", format: "csv", mode: "all", icon: <FaFileCsv className="text-emerald-600 dark:text-emerald-400" /> },
      { label: "Excel All", format: "excel", mode: "all", icon: <FaFileExcel className="text-green-700 dark:text-green-400" /> },
      { label: "PDF All", format: "pdf", mode: "all", icon: <FaFilePdf className="text-rose-600 dark:text-rose-400" /> },
    ],
  },
];

export default function ExportActionsMenu({ onExport, disabled, className, iconOnly, inlinePanel, selectedCount = 0 }: ExportActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onOverlayOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ source?: string }>;
      if (customEvent.detail?.source === "filter") {
        setIsOpen(false);
      }
    };

    window.addEventListener("entity-overlay-open", onOverlayOpen as EventListener);
    return () => {
      window.removeEventListener("entity-overlay-open", onOverlayOpen as EventListener);
    };
  }, []);

  const menuItems = useMemo(() => {
    if (selectedCount > 0) return optionGroups;
    return optionGroups.filter((group) => group.label === "All rows");
  }, [selectedCount]);

  return (
    <div className={clsx("relative z-10 inline-flex", className)}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => {
            const next = !prev;
            if (next) {
              window.dispatchEvent(new CustomEvent("entity-overlay-open", { detail: { source: "export" } }));
            }
            return next;
          });
        }}
        disabled={disabled}
        className={clsx(
          "inline-flex items-center gap-2 rounded-xl border text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
          iconOnly
            ? "h-10 w-10 justify-center px-0 bg-white/90 text-cyan-700 border-cyan-200 hover:bg-cyan-50 dark:bg-slate-900 dark:text-cyan-300 dark:border-cyan-500/20 dark:hover:bg-cyan-500/10"
            : "bg-white/90 px-4 py-2.5 text-cyan-700 border-cyan-200 hover:bg-cyan-50 dark:bg-slate-900 dark:text-cyan-300 dark:border-cyan-500/20 dark:hover:bg-cyan-500/10",
        )}
        title="Export"
      >
        <FiDownload />
        {!iconOnly && "Download"}
        {!iconOnly && <FiChevronDown className={clsx("transition-transform", isOpen && "rotate-180")} />}
      </button>

      {isOpen && (
        <div
          className={clsx(
            "w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900",
            inlinePanel ? "mt-2" : "absolute right-0 top-full z-[60] mt-2"
          )}
        >
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
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span className="text-base">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}