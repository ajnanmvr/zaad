"use client";

import { FiPrinter } from "react-icons/fi";
import toast from "react-hot-toast";

import { printElementById } from "@/utils/printReport";

type PrintReportButtonProps = {
  targetId: string;
  reportTitle: string;
  className?: string;
  label?: string;
};

export default function PrintReportButton({
  targetId,
  reportTitle,
  className,
  label = "Print / Save PDF",
}: PrintReportButtonProps) {
  const onPrint = () => {
    try {
      printElementById(targetId, reportTitle);
    } catch (error) {
      console.error(error);
      toast.error("Could not open printable report");
    }
  };

  return (
    <button
      type="button"
      onClick={onPrint}
      className={
        className ||
        "inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
      }
    >
      <FiPrinter />
      {label}
    </button>
  );
}
