"use client";

import axios from "axios";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactToPrint from "react-to-print";
import { FiAlertTriangle, FiChevronLeft, FiFileText } from "react-icons/fi";
import { formatDubaiDateTime } from "@/utils/dubaiTime";

type StatementViewProps = {
  entityType: "company" | "employee" | "individual";
  id: string;
  mode: "all-time" | "custom";
  scope?: "company" | "employees" | "mixed";
  from?: string;
  to?: string;
};

type StatementResponse = {
  success: boolean;
  statement: {
    statementNo: string;
    statementDate: string;
    periodLabel: string;
    currency: string;
    entity: {
      id: string;
      entityType: string;
      name: string;
      color?: string;
      licenseNo?: string;
      phone1?: string;
      phone2?: string;
      email?: string;
      remarks?: string;
      company?: { id: string; name: string; color?: string };
      emiratesId?: string;
      nationality?: string;
      designation?: string;
    };
    summary: {
      openingBalance: number;
      totalDebits: number;
      totalCredits: number;
      closingBalance: number;
    };
    aging: {
      current: number;
      days30: number;
      days60: number;
      days90: number;
      over90: number;
    };
    rows: Array<{
      date: string;
      refNo: string;
      jobNo: string;
      transaction: string;
      particulars: string;
      debit: number;
      credit: number;
      balance: number;
    }>;
    generatedAt: string;
    periodFrom: string;
    periodTo: string;
  };
};

const formatCurrency = (value: number) => Number(value || 0).toFixed(2);

export default function StatementOfAccountView({
  entityType,
  id,
  mode,
  scope,
  from,
  to,
}: StatementViewProps) {
  const componentRef = useRef<HTMLDivElement | null>(null);

  const statementQuery = useQuery<StatementResponse>({
    queryKey: ["statement-of-account", entityType, id, mode, scope, from, to],
    queryFn: async () => {
      const { data } = await axios.get(`/api/statement-of-account/${entityType}/${id}`, {
        params: {
          mode,
          scope,
          from,
          to,
        },
      });
      return data;
    },
    enabled: Boolean(entityType && id),
  });

  const statement = statementQuery.data?.statement;

  const clientRows = useMemo(() => {
    if (!statement?.entity) return [];

    return [
      { label: "Customer ID", value: statement.entity.id || "---" },
      { label: "Client Name", value: statement.entity.name || "---" },
      { label: "Trade License No.", value: statement.entity.licenseNo || "---" },
      { label: "Contact Person", value: statement.entity.designation || statement.entity.remarks || "---" },
      { label: "Mobile", value: statement.entity.phone1 || statement.entity.phone2 || "---" },
      { label: "Email", value: statement.entity.email || "---" },
    ];
  }, [statement]);

  const agingRows = useMemo(
    () => [
      { label: "Current", value: statement?.aging.current || 0 },
      { label: "1-30 Days", value: statement?.aging.days30 || 0 },
      { label: "31-60 Days", value: statement?.aging.days60 || 0 },
      { label: "61-90 Days", value: statement?.aging.days90 || 0 },
      { label: "Over 90 Days", value: statement?.aging.over90 || 0 },
    ],
    [statement],
  );

  if (statementQuery.isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  if (!statement) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
        Failed to load statement data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-300 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-950">
        <Link
          href={`/${entityType}/${id}/records`}
          className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        >
          <FiChevronLeft /> Back to Records
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
        className="w-full bg-white p-10 text-black uppercase print:min-h-[275mm] print:box-border bg-invoice bg-contain"
      >
        <Image
          src="/images/invoice/header.png"
          alt="Zaad Header"
          width={1400}
          height={200}
          className="h-auto w-full"
          priority
        />

        <div className="mt-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 border border-cyan-400 bg-cyan-100 px-2 py-1 text-[11px] font-bold tracking-[0.14em] text-cyan-800">
              <FiFileText /> STATEMENT OF ACCOUNT
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              {statement.entity.name}
            </h1>
            {statement.entity.company?.name && (
              <p className="text-xs normal-case text-slate-600">
                Company: {statement.entity.company.name}
              </p>
            )}
          </div>

          <table className="text-xs normal-case">
            <tbody>
              <tr>
                <td className="border border-slate-300 bg-slate-100 px-3 py-1 font-bold">Statement No.</td>
                <td className="border border-slate-300 px-3 py-1">{statement.statementNo}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-100 px-3 py-1 font-bold">Statement Date</td>
                <td className="border border-slate-300 px-3 py-1">{statement.statementDate}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-100 px-3 py-1 font-bold">Statement Period</td>
                <td className="border border-slate-300 px-3 py-1">{statement.periodLabel}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-100 px-3 py-1 font-bold">Currency</td>
                <td className="border border-slate-300 px-3 py-1">{statement.currency}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
          <div>
            <h2 className="mb-3 text-base font-black tracking-[0.08em] text-slate-900">Client Information</h2>
            <table className="w-full border border-slate-300 text-sm normal-case">
              <tbody>
                {clientRows.map((row) => (
                  <tr key={row.label} className="odd:bg-white even:bg-slate-50">
                    <td className="border border-slate-300 bg-slate-100 px-3 py-2 font-bold text-slate-900">{row.label}</td>
                    <td className="border border-slate-300 px-3 py-2 text-slate-900">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h2 className="mb-3 text-base font-black tracking-[0.08em] text-slate-900">Account Summary</h2>
            <table className="w-full border border-slate-300 text-sm normal-case">
              <tbody>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 px-3 py-2 font-bold">Opening Balance</td>
                  <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">AED {formatCurrency(statement.summary.openingBalance)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-2 font-bold">Total Debits (Charges)</td>
                  <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">AED {formatCurrency(statement.summary.totalDebits)}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 px-3 py-2 font-bold">Total Credits (Payments)</td>
                  <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">AED {formatCurrency(statement.summary.totalCredits)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-2 font-black">Closing Balance / Outstanding</td>
                  <td className="border border-slate-300 px-3 py-2 text-right text-base font-black tabular-nums">AED {formatCurrency(statement.summary.closingBalance)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="mb-3 text-base font-black tracking-[0.08em] text-slate-900">Statement of Transactions</h2>
          <table className="w-full border border-slate-300 text-[11px] normal-case">
            <thead>
              <tr className="bg-cyan-100 text-cyan-900">
                <th className="border border-slate-300 px-2 py-2 text-left">Date</th>
                <th className="border border-slate-300 px-2 py-2 text-left">Ref. No.</th>
                <th className="border border-slate-300 px-2 py-2 text-left">Job No.</th>
                <th className="border border-slate-300 px-2 py-2 text-left">Transaction</th>
                <th className="border border-slate-300 px-2 py-2 text-left">Particulars</th>
                <th className="border border-slate-300 px-2 py-2 text-right">Debit (AED)</th>
                <th className="border border-slate-300 px-2 py-2 text-right">Credit (AED)</th>
                <th className="border border-slate-300 px-2 py-2 text-right">Balance (AED)</th>
              </tr>
            </thead>
            <tbody>
              {statement.rows.map((row, index) => (
                <tr key={`${row.refNo}-${index}`} className={clsx(index % 2 === 0 ? "bg-white" : "bg-slate-50")}>
                  <td className="border border-slate-300 px-2 py-2">{row.date}</td>
                  <td className="border border-slate-300 px-2 py-2">{row.refNo}</td>
                  <td className="border border-slate-300 px-2 py-2">{row.jobNo}</td>
                  <td className="border border-slate-300 px-2 py-2 font-semibold">{row.transaction}</td>
                  <td className="border border-slate-300 px-2 py-2">{row.particulars}</td>
                  <td className="border border-slate-300 px-2 py-2 text-right tabular-nums">{row.debit ? formatCurrency(row.debit) : "-"}</td>
                  <td className="border border-slate-300 px-2 py-2 text-right tabular-nums">{row.credit ? formatCurrency(row.credit) : "-"}</td>
                  <td className="border border-slate-300 px-2 py-2 text-right font-bold tabular-nums">{formatCurrency(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded border border-slate-300 bg-slate-50 px-4 py-3 text-xs normal-case text-slate-700">
            <p className="font-bold text-slate-900">Notes</p>
            <p className="mt-2">This statement reflects all transactions posted to your account during the selected period.</p>
            <p className="mt-1">If you have already made payment, please share the payment confirmation for reconciliation.</p>
            <p className="mt-1">Any discrepancy should be reported within 7 days of the statement date.</p>
          </div>

          <div className="rounded border border-slate-300 bg-slate-50 px-4 py-3 text-xs normal-case text-slate-700">
            <p className="font-bold text-slate-900">Aging Summary</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              {[
                { label: "Current", value: statement.aging.current },
                { label: "1-30 Days", value: statement.aging.days30 },
                { label: "31-60 Days", value: statement.aging.days60 },
                { label: "61-90 Days", value: statement.aging.days90 },
                { label: "Over 90 Days", value: statement.aging.over90 },
              ].map((row) => (
                <div key={row.label} className="rounded border border-slate-200 bg-white px-2 py-2">
                  <p className="font-bold text-slate-500">{row.label}</p>
                  <p className="mt-1 font-black text-slate-900 tabular-nums">AED {formatCurrency(row.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs normal-case text-slate-600">Prepared By: ____</p>
            <p className="mt-8 text-sm font-semibold">ZAAD BUSINESS DOCUMENTS SERVICES</p>
          </div>
          <div className="text-right">
            <p className="text-xs normal-case text-slate-600">Generated At: {formatDubaiDateTime(statement.generatedAt)}</p>
            <p className="mt-8 text-xs font-semibold normal-case text-slate-600">Authorized Signatory</p>
          </div>
        </div>
      </section>

      {statementQuery.isFetching && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <FiAlertTriangle /> Refreshing statement data...
          </div>
        </div>
      )}
    </div>
  );
}