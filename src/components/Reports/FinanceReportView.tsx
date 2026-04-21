"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactToPrint from "react-to-print";
import {
  FiAlertTriangle,
  FiCalendar,
  FiChevronLeft,
  FiFileText,
} from "react-icons/fi";
import clsx from "clsx";

export type FinanceReportResponse = {
  success: boolean;
  summary: {
    range: { from: string; to: string };
    totals: {
      totalTransactions: number;
      totalIncome: number;
      totalExpense: number;
      totalServiceFee: number;
      net: number;
      entityBalance: number;
    };
    paymentMethods: Array<{
      methodId: string;
      methodLabel: string;
      methodColor?: string;
      methodIcon?: string;
      income: number;
      expense: number;
      net: number;
      transactions: number;
    }>;
    officeCategories: Array<{
      categoryId: string;
      categoryLabel: string;
      income: number;
      expense: number;
      balance: number;
    }>;
  };
};

type FinanceReportViewProps = {
  mode: "month" | "year" | "financial-year" | "custom";
  from: string;
  to: string;
  year?: string;
  month?: string;
};

const formatCurrency = (value: number) =>
  `AED ${Number(value || 0).toFixed(2)}`;

const formatHuman = (dateInput?: string) => {
  if (!dateInput) return "---";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "---";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const modeLabelMap: Record<FinanceReportViewProps["mode"], string> = {
  month: "Monthly Report",
  year: "Yearly Report",
  "financial-year": "Financial Year Report",
  custom: "Custom Range Report",
};

export default function FinanceReportView(props: FinanceReportViewProps) {
  const componentRef = useRef<HTMLDivElement | null>(null);
  const reportTitle = modeLabelMap[props.mode];

  const reportQuery = useQuery<FinanceReportResponse>({
    queryKey: ["finance-report-view", props.from, props.to],
    queryFn: async () => {
      const { data } = await axios.get("/api/payment/reports", {
        params: {
          from: props.from,
          to: props.to,
        },
      });
      return data;
    },
    enabled: Boolean(props.from && props.to),
  });

  const report = reportQuery.data?.summary;
  const reportTo = report?.range.to;

  const summaryRows = useMemo(() => {
    const totalTransactions = Number(report?.totals.totalTransactions || 0);
    const totalIncome = Number(report?.totals.totalIncome || 0);
    const totalExpense = Number(report?.totals.totalExpense || 0);
    const totalServiceFee = Number(report?.totals.totalServiceFee || 0);

    // Calculate total office income/expense from officeCategories
    const officeIncome = (report?.officeCategories || []).reduce(
      (sum, c) => sum + (c.income || 0),
      0,
    );
    const officeExpense = (report?.officeCategories || []).reduce(
      (sum, c) => sum + (c.expense || 0),
      0,
    );
    const profit = Number(totalServiceFee - officeExpense);

    return [
      { metric: "Total Transactions", value: String(totalTransactions) },
      { metric: "Total Income", value: formatCurrency(totalIncome) },
      { metric: "Total Expense", value: formatCurrency(totalExpense) },
      { metric: "Service Fee", value: formatCurrency(totalServiceFee) },
      { metric: "Office Income", value: formatCurrency(officeIncome) },
      { metric: "Office Expense", value: formatCurrency(officeExpense) },
      { metric: "Profit", value: formatCurrency(profit) },
    ];
  }, [report]);

  const incompletePeriodNotice = useMemo(() => {
    if (!reportTo) return null;

    const reportEnd = new Date(reportTo);
    if (Number.isNaN(reportEnd.getTime())) return null;

    let expectedEnd: Date | null = null;

    if (props.mode === "month") {
      const year = Number(props.year);
      const month = Number(props.month);
      if (
        Number.isFinite(year) &&
        Number.isFinite(month) &&
        month >= 1 &&
        month <= 12
      ) {
        expectedEnd = new Date(year, month, 0);
      }
    } else if (props.mode === "year") {
      const year = Number(props.year);
      if (Number.isFinite(year)) {
        expectedEnd = new Date(year, 11, 31);
      }
    } else if (props.mode === "financial-year") {
      const startYear = Number(props.year);
      if (Number.isFinite(startYear)) {
        expectedEnd = new Date(startYear + 1, 5, 30);
      }
    }

    if (!expectedEnd) return null;
    if (reportEnd.getTime() >= expectedEnd.getTime()) return null;

    return `In-progress period: this ${props.mode === "month" ? "month" : props.mode === "year" ? "year" : "financial year"} report includes values up to ${formatHuman(reportTo)}.`;
  }, [props.mode, props.month, props.year, reportTo]);

  const periodLabel =
    props.mode === "financial-year"
      ? `FY ${props.year || "---"}`
      : props.mode === "month"
        ? `${props.month || "--"}/${props.year || "----"}`
        : props.mode === "year"
          ? props.year || "----"
          : "Custom Range";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-300 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-950">
        <Link
          href="/accounts/transactions/reports"
          className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <FiChevronLeft /> Back to Report Form
        </Link>

        <ReactToPrint
          trigger={() => (
            <p className="cursor-pointer border border-slate-300 bg-primary px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-primary/90">
              Download / Print
            </p>
          )}
          content={() => componentRef.current}
          pageStyle={`
            @page {
              size: A4;
              margin: 0;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          `}
        />
      </div>

      <section
        ref={componentRef}
        className="w-full p-10 bg-white text-black uppercase print:min-h-[275mm] print:box-border bg-invoice bg-contain"
      >


        <Image
          src="/images/invoice/header.png"
          alt="Invoice Header"
          width={1400}
          height={200}
          className="h-auto w-full"
          priority
        />

        <div className="mt-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 border border-sky-400 bg-sky-100 px-2 py-1 text-[11px] font-bold tracking-[0.14em] text-sky-800">
                <FiFileText /> FINANCE REPORT
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {reportTitle}
              </h1>
            </div>
            <table className="text-xs">
              <tbody>
                <tr>
                  <td className="border border-slate-300 bg-slate-100 px-3 py-1 font-bold">
                    TYPE
                  </td>
                  <td className="border border-slate-300 px-3 py-1 normal-case">
                    {reportTitle}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-100 px-3 py-1 font-bold">
                    PERIOD
                  </td>
                  <td className="border border-slate-300 px-3 py-1 normal-case">
                    {formatHuman(report?.range.from)} -{" "}
                    {formatHuman(report?.range.to)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-100 px-3 py-1 font-bold">
                    LABEL
                  </td>
                  <td className="border border-slate-300 px-3 py-1 normal-case">
                    {periodLabel}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-100 px-3 py-1 font-bold">
                    GENERATED
                  </td>
                  <td className="border border-slate-300 px-3 py-1 normal-case">
                    {new Date().toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        {incompletePeriodNotice && (
          <div className="border mt-5 border-amber-400 bg-amber-100 px-6 py-3 text-sm font-semibold normal-case text-amber-900">
            <div className="flex items-start gap-2">
              <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{incompletePeriodNotice}</span>
            </div>
          </div>
        )}

        <div className="mt-10">
          <h2 className="mb-3 text-base font-black tracking-[0.08em] text-slate-900">
            FINANCE SUMMARY DETAILS
          </h2>
          <table className="w-full border border-slate-300 text-sm normal-case">
            <thead>
              <tr className="bg-cyan-100 text-cyan-900">
                <th className="border border-slate-300 px-3 py-2 text-left">
                  Metric
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row) => (
                <tr key={row.metric} className="odd:bg-white even:bg-slate-50">
                  <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-900">
                    {row.metric}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-bold tabular-nums text-slate-900">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10">
          <h2 className="mb-3 text-base font-black tracking-[0.08em] text-slate-900">
            PAYMENT METHOD DETAILS
          </h2>
          <table className="w-full border border-slate-300 text-sm normal-case">
            <thead>
              <tr className="bg-emerald-100 text-emerald-900">
                <th className="border border-slate-300 px-3 py-2 text-left">
                  Method
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  Income
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  Expense
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  Net
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  Transactions
                </th>
              </tr>
            </thead>
            <tbody>
              {(report?.paymentMethods || []).length > 0 ? (
                (report?.paymentMethods || []).map((row) => (
                  <tr
                    key={row.methodId}
                    className="odd:bg-white even:bg-slate-50"
                  >
                    <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-900">
                      {row.methodLabel}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right tabular-nums text-slate-900">
                      {formatCurrency(row.income)}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right tabular-nums text-slate-900">
                      {formatCurrency(row.expense)}
                    </td>
                    <td
                      className={clsx(
                        "border border-slate-300 px-3 py-2 text-right font-bold tabular-nums",
                        row.net >= 0 ? "text-emerald-700" : "text-rose-700",
                      )}
                    >
                      {formatCurrency(row.net)}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right tabular-nums text-slate-900">
                      {row.transactions}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="border border-slate-300 px-3 py-3 text-center text-slate-600"
                  >
                    No payment method data in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-10">
          <h2 className="mb-3 text-base font-black tracking-[0.08em] text-slate-900">
            OFFICE CATEGORY DETAILS
          </h2>
          <table className="w-full border border-slate-300 text-sm normal-case">
            <thead>
              <tr className="bg-fuchsia-100 text-fuchsia-900">
                <th className="border border-slate-300 px-3 py-2 text-left">
                  Category
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  Income
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  Expense
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {(report?.officeCategories || []).length > 0 ? (
                (report?.officeCategories || []).map((row) => (
                  <tr
                    key={row.categoryId}
                    className="odd:bg-white even:bg-slate-50"
                  >
                    <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-900">
                      {row.categoryLabel}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right tabular-nums text-slate-900">
                      {formatCurrency(row.income)}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right tabular-nums text-slate-900">
                      {formatCurrency(row.expense)}
                    </td>
                    <td
                      className={clsx(
                        "border border-slate-300 px-3 py-2 text-right font-bold tabular-nums",
                        row.balance >= 0 ? "text-emerald-700" : "text-rose-700",
                      )}
                    >
                      {formatCurrency(row.balance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="border border-slate-300 px-3 py-3 text-center text-slate-600"
                  >
                    No office category data in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {reportQuery.isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-10 w-10 animate-spin border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      )}

      {reportQuery.isError && (
        <div className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
          Failed to load report data.
        </div>
      )}
    </div>
  );
}
