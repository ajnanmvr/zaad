import FinanceReportView from "@/components/Reports/FinanceReportView";
import { redirect } from "next/navigation";

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
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (mode === "month") {
    const year = Number(searchParams?.year || currentYear);
    const month = Number(searchParams?.month || currentMonth);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return null;
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const cappedEnd = end > now ? now : end;
    if (start < new Date(2024, 6, 1)) return null;
    if (start > now) return null;

    return {
      mode: "month" as const,
      from: start.toISOString().slice(0, 10),
      to: cappedEnd.toISOString().slice(0, 10),
      year: String(year),
      month: String(month).padStart(2, "0"),
    };
  }

  if (mode === "year") {
    const year = Number(searchParams?.year || currentYear);
    if (!Number.isFinite(year) || year < 2024 || year > currentYear) return null;

    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    const cappedEnd = end > now ? now : end;

    return {
      mode: "year" as const,
      from: start.toISOString().slice(0, 10),
      to: cappedEnd.toISOString().slice(0, 10),
      year: String(year),
    };
  }

  if (mode === "financial-year") {
    const startYear = Number(searchParams?.year || (currentMonth >= 7 ? currentYear : currentYear - 1));
    if (!Number.isFinite(startYear) || startYear < 2024 || startYear > (currentMonth >= 7 ? currentYear : currentYear - 1)) return null;

    const start = new Date(startYear, 6, 1);
    const end = new Date(startYear + 1, 5, 30);
    const cappedEnd = end > now ? now : end;

    return {
      mode: "financial-year" as const,
      from: start.toISOString().slice(0, 10),
      to: cappedEnd.toISOString().slice(0, 10),
      year: String(startYear),
    };
  }

  if (mode === "custom") {
    const from = String(searchParams?.from || "").trim();
    const to = String(searchParams?.to || "").trim();
    if (!from || !to) return null;
    if (new Date(from) > new Date(to)) return null;
    if (from < "2024-07-01") return null;
    if (to > now.toISOString().slice(0, 10)) return null;

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
