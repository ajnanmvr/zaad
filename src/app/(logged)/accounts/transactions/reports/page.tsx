"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { hasPermission } from "@/auth/permissions";
import { useUserContext } from "@/contexts/UserContext";
import { formatDubaiMonthLabel, getDubaiCurrentYearMonth } from "@/utils/dubaiTime";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCalendar, FiFileText, FiArrowRight } from "react-icons/fi";

type ReportMode = "month" | "year" | "financial-year" | "custom";

const START_YEAR = 2024;
const START_MONTH = 7;

function toInputDate(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    .toISOString()
    .slice(0, 10);
}

function formatMonthLabel(year: number, month: number) {
  return formatDubaiMonthLabel(year, month);
}

function buildMonthOptions(year: number, now: Date) {
  const startMonth = year === START_YEAR ? START_MONTH : 1;
  const endMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12;
  return Array.from({ length: Math.max(endMonth - startMonth + 1, 0) }, (_, index) => startMonth + index);
}

function isValidYear(year: number, now: Date) {
  return Number.isFinite(year) && year >= START_YEAR && year <= now.getFullYear();
}

function getFiscalYearOptions(now: Date) {
  const maxStartYear = now.getMonth() + 1 >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return Array.from({ length: Math.max(maxStartYear - START_YEAR + 1, 0) }, (_, index) => START_YEAR + index);
}

export default function FinanceReportsPage() {
  const now = useMemo(() => {
    const { year, month } = getDubaiCurrentYearMonth();
    return new Date(Date.UTC(year, month - 1, 1));
  }, []);
  const { user, isUserLoading } = useUserContext();
  const router = useRouter();
  const permissions = Array.isArray(user?.permissions) ? (user.permissions as string[]) : [];
  const canViewReports = hasPermission(permissions, "payments.view.records-summary") || hasPermission(permissions, "payments.view.finance-summary-page") || hasPermission(permissions, "payments.view.reports") || hasPermission(permissions, "payments.view.finance");

  useEffect(() => {
    if (!isUserLoading && user && !canViewReports) {
      router.replace("/not-permitted");
    }
  }, [isUserLoading, user, canViewReports, router]);

  const [reportMode, setReportMode] = useState<ReportMode>("month");
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [financialYearStart, setFinancialYearStart] = useState(String(now.getMonth() + 1 >= 7 ? now.getFullYear() : now.getFullYear() - 1));
  const [customFrom, setCustomFrom] = useState(toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customTo, setCustomTo] = useState(toInputDate(now));

  const yearOptions = useMemo(() => {
    const values = [] as number[];
    for (let year = START_YEAR; year <= now.getFullYear(); year += 1) {
      values.push(year);
    }
    return values;
  }, [now]);

  const monthOptions = useMemo(() => buildMonthOptions(Number(selectedYear), now), [now, selectedYear]);
  const financialYearOptions = useMemo(() => getFiscalYearOptions(now), [now]);

  const generatedHref = useMemo(() => {
    const params = new URLSearchParams();

    if (reportMode === "month") {
      const year = Number(selectedYear);
      const month = Number(selectedMonth);
      if (!isValidYear(year, now) || !monthOptions.includes(month)) {
        return null;
      }
      params.set("mode", "month");
      params.set("year", String(year));
      params.set("month", String(month));
      return `/accounts/transactions/reports/view?${params.toString()}`;
    }

    if (reportMode === "year") {
      const year = Number(selectedYear);
      if (!isValidYear(year, now)) return null;
      params.set("mode", "year");
      params.set("year", String(year));
      return `/accounts/transactions/reports/view?${params.toString()}`;
    }

    if (reportMode === "financial-year") {
      const startYear = Number(financialYearStart);
      const maxStartYear = now.getMonth() + 1 >= 7 ? now.getFullYear() : now.getFullYear() - 1;
      if (!Number.isFinite(startYear) || startYear < START_YEAR || startYear > maxStartYear) return null;
      params.set("mode", "financial-year");
      params.set("year", String(startYear));
      return `/accounts/transactions/reports/view?${params.toString()}`;
    }

    if (!customFrom || !customTo || new Date(customFrom) > new Date(customTo)) {
      return null;
    }

    const minDate = `${START_YEAR}-07-01`;
    if (customFrom < minDate || customTo > toInputDate(now)) return null;

    params.set("mode", "custom");
    params.set("from", customFrom);
    params.set("to", customTo);
    return `/accounts/transactions/reports/view?${params.toString()}`;
  }, [customFrom, customTo, financialYearStart, monthOptions, now, reportMode, selectedMonth, selectedYear]);

  if (isUserLoading || (!canViewReports && user)) {
    return (
      <div className="space-y-6">
        <Breadcrumb pageName="Finance Reports" />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
          Loading access...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Finance Reports" />

      <section className="rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm dark:border-emerald-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-300">
              <FiFileText /> Printable Finance Reports
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Finance Report Generator</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Generate monthly, yearly, financial-year, or custom-range reports and open a print-ready invoice-style page.</p>
          </div>

          <Link
            href={generatedHref || "#"}
            aria-disabled={!generatedHref}
            onClick={(event) => {
              if (!generatedHref) {
                event.preventDefault();
              }
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:pointer-events-none disabled:opacity-50 dark:border-emerald-700/40 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800"
          >
            Generate <FiArrowRight />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900/70 xl:col-span-2">
            <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Report Type</span>
            <select value={reportMode} onChange={(e) => setReportMode(e.target.value as ReportMode)} className="w-full bg-transparent text-sm outline-none">
              <option value="month">Monthly</option>
              <option value="year">Normal Year</option>
              <option value="financial-year">Financial Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </label>

          {reportMode === "month" && (
            <>
              <label className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900/70">
                <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Year</span>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full bg-transparent text-sm outline-none">
                  {yearOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900/70">
                <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Month</span>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full bg-transparent text-sm outline-none">
                  {monthOptions.map((value) => (
                    <option key={value} value={String(value).padStart(2, "0")}>
                      {formatMonthLabel(Number(selectedYear), value)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {reportMode === "year" && (
            <label className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900/70 xl:col-span-2">
              <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Year</span>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full bg-transparent text-sm outline-none">
                {yearOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          )}

          {reportMode === "financial-year" && (
            <label className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900/70 xl:col-span-2">
              <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Financial Year Start</span>
              <select value={financialYearStart} onChange={(e) => setFinancialYearStart(e.target.value)} className="w-full bg-transparent text-sm outline-none">
                {financialYearOptions.map((value) => (
                  <option key={value} value={value}>
                    FY {value}-{String(value + 1).slice(-2)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {reportMode === "custom" && (
            <>
              <label className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900/70">
                <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">From</span>
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} min="2024-07-01" max={toInputDate(now)} className="w-full bg-transparent text-sm outline-none" />
              </label>
              <label className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900/70">
                <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">To</span>
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} min="2024-07-01" max={toInputDate(now)} className="w-full bg-transparent text-sm outline-none" />
              </label>
            </>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
          Available data starts from <span className="font-bold text-slate-900 dark:text-slate-100">July 2024</span> and ends at <span className="font-bold text-slate-900 dark:text-slate-100">{formatDubaiMonthLabel(now.getFullYear(), now.getMonth() + 1)}</span>.
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
        <div className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-100">
          <FiCalendar /> What the generated page will do
        </div>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Open a print-ready report page that uses the same ReactToPrint behavior as the invoice page.</li>
          <li>Show totals, payment methods, and office category breakdowns in an invoice-style layout.</li>
          <li>Respect the report window and only generate periods within the available data range.</li>
        </ul>
      </section>
    </div>
  );
}
