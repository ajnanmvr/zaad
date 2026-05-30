import FinanceReportView from "@/components/Reports/FinanceReportView";
import { redirect } from "next/navigation";
import { getDubaiCurrentYearMonth, getDubaiDateParts } from "@/utils/dubaiTime";

function formatDubaiInputDate(date: Date) {
  const { year, month, day } = getDubaiDateParts(date);
  const monthText = String(month).padStart(2, "0");
  const dayText = String(day).padStart(2, "0");
  return `${year}-${monthText}-${dayText}`;
}

function buildDubaiDateString(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type PageProps = {
  searchParams?: {
    mode?: string;
    year?: string;
    month?: string;
    from?: string;
    to?: string;
  };
};

function resolveRange(searchParams?: PageProps["searchParams"]) {
  const mode = String(searchParams?.mode || "month").trim();
  const now = new Date();
  const { year: currentYear, month: currentMonth } = getDubaiCurrentYearMonth();

  if (mode === "month") {
    const year = Number(searchParams?.year || currentYear);
    const month = Number(searchParams?.month || currentMonth);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return null;
    }

    const start = buildDubaiDateString(year, month, 1);
    const end = month === 12
      ? buildDubaiDateString(year + 1, 1, 1)
      : buildDubaiDateString(year, month + 1, 1);
    const today = formatDubaiInputDate(now);
    const cappedEnd = end > today ? today : end;
    if (start < "2024-07-01") return null;
    if (start > today) return null;

    return {
      mode: "month" as const,
      from: start,
      to: cappedEnd,
      year: String(year),
      month: String(month).padStart(2, "0"),
    };
  }

  if (mode === "year") {
    const year = Number(searchParams?.year || currentYear);
    if (!Number.isFinite(year) || year < 2024 || year > currentYear) return null;

    const start = buildDubaiDateString(year, 1, 1);
    const end = buildDubaiDateString(year + 1, 1, 1);
    const today = formatDubaiInputDate(now);
    const cappedEnd = end > today ? today : end;

    return {
      mode: "year" as const,
      from: start,
      to: cappedEnd,
      year: String(year),
    };
  }

  if (mode === "financial-year") {
    const startYear = Number(searchParams?.year || (currentMonth >= 7 ? currentYear : currentYear - 1));
    if (!Number.isFinite(startYear) || startYear < 2024 || startYear > (currentMonth >= 7 ? currentYear : currentYear - 1)) return null;

    const start = buildDubaiDateString(startYear, 7, 1);
    const end = buildDubaiDateString(startYear + 1, 7, 1);
    const today = formatDubaiInputDate(now);
    const cappedEnd = end > today ? today : end;

    return {
      mode: "financial-year" as const,
      from: start,
      to: cappedEnd,
      year: String(startYear),
    };
  }

  if (mode === "custom") {
    const from = String(searchParams?.from || "").trim();
    const to = String(searchParams?.to || "").trim();
    if (!from || !to) return null;
    if (from > to) return null;
    if (from < "2024-07-01") return null;
    if (to > formatDubaiInputDate(now)) return null;

    return { mode: "custom" as const, from, to };
  }

  return null;
}

export default function FinanceReportViewPage({ searchParams }: PageProps) {
  const resolved = resolveRange(searchParams);

  if (!resolved) {
    redirect("/accounts/transactions/reports");
  }

  return <FinanceReportView {...resolved} />;
}
