"use client";

import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import ReactToPrint from "react-to-print";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type SOARow = {
  date: string;
  jobNo: string | null;
  refNo: string | null;
  transaction: string;
  particular: string;
  paymentMethod: string | null;
  remarks: string | null;
  debit?: number;
  credit?: number;
  balance: number;
};

type SOAData = {
  entity: { name: string; phone: string | null; email: string | null; licenseNo: string | null };
  entityType: string;
  statementNo: string;
  statementDate: string;
  dateFrom: string | null;
  dateTo: string | null;
  openingBalance: number;
  rows: SOARow[];
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  aging: { current: number; days30: number; days60: number; days90: number; over90: number };
};

const COLS = [
  { key: "jobNo",         label: "Job No",          defaultOn: false },
  { key: "refNo",         label: "Ref No",           defaultOn: false },
  { key: "transaction",   label: "Transaction",      defaultOn: false },
  { key: "paymentMethod", label: "Payment Method",   defaultOn: true  },
  { key: "remarks",       label: "Remarks",          defaultOn: false },
] as const;

type ColKey = (typeof COLS)[number]["key"];

const fmt = (n?: number) => (n == null ? "" : Math.abs(n).toFixed(2));
const fmtSigned = (n: number) =>
  `${Math.abs(n).toFixed(2)}${n < 0 ? " CR" : n > 0 ? " DR" : ""}`;

export default function SOAPage() {
  const { entityType, id } = useParams<{ entityType: string; id: string }>();
  const sp = useSearchParams();
  const dateFrom = sp.get("from") || undefined;
  const dateTo = sp.get("to") || undefined;
  const componentRef = useRef<HTMLDivElement>(null);

  const initCols = Object.fromEntries(COLS.map((c) => [c.key, c.defaultOn])) as Record<ColKey, boolean>;
  const [cols, setCols] = useState<Record<ColKey, boolean>>(initCols);
  const [showAging, setShowAging] = useState(true);

  const toggle = (key: ColKey) => setCols((prev) => ({ ...prev, [key]: !prev[key] }));

  const { data, isLoading, isError } = useQuery<SOAData>({
    queryKey: ["soa", entityType, id, dateFrom, dateTo],
    queryFn: async () => {
      const p = new URLSearchParams({ entityType, entityId: id });
      if (dateFrom) p.set("from", dateFrom);
      if (dateTo) p.set("to", dateTo);
      const { data } = await axios.get(`/api/payment/soa?${p.toString()}`);
      return data;
    },
    enabled: Boolean(entityType) && Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-red-500">
        Failed to load statement of account.
      </div>
    );
  }

  const periodLabel =
    data.dateFrom && data.dateTo ? `${data.dateFrom} to ${data.dateTo}` : "All Time";
  const outstanding = data.closingBalance > 0 ? data.closingBalance : 0;

  return (
    <>
      {/* ── Column toggles (not printed) ── */}
      <div className="print:hidden mb-3 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Columns:</span>
        {COLS.map((c) => (
          <label key={c.key} className="flex cursor-pointer items-center gap-1.5 select-none">
            <input
              type="checkbox"
              checked={cols[c.key]}
              onChange={() => toggle(c.key)}
              className="h-3.5 w-3.5 cursor-pointer accent-primary"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">{c.label}</span>
          </label>
        ))}
        <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <label className="flex cursor-pointer items-center gap-1.5 select-none">
          <input
            type="checkbox"
            checked={showAging}
            onChange={() => setShowAging((v) => !v)}
            className="h-3.5 w-3.5 cursor-pointer accent-primary"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">Aging Summary</span>
        </label>
      </div>

      <ReactToPrint
        trigger={() => (
          <button className="print:hidden mb-4 w-full rounded-t-md bg-primary px-4 py-3 text-center font-medium text-white transition hover:bg-opacity-90">
            Download / Print
          </button>
        )}
        content={() => componentRef.current}
        pageStyle={`@page{size:A4;margin:0}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}`}
      />

      <div
        ref={componentRef}
        className="bg-white text-black bg-invoice bg-contain w-full px-10 py-8 print:px-8 print:py-6 print:min-h-[275mm] print:box-border"
      >
        {/* ZAAD header */}
        <Image
          src="/images/invoice/header.png"
          alt="ZAAD"
          width={1400}
          height={200}
          className="w-full h-auto mb-4"
          priority
        />

        {/* ── Compact meta strip ── */}
        <div className="flex items-stretch gap-0 border border-slate-200 rounded overflow-hidden mb-3 text-xs">
          {/* Title cell */}
          <div className="bg-slate-800 text-white px-3 py-2 flex items-center">
            <span className="font-bold uppercase tracking-widest whitespace-nowrap text-sm">
              Statement of Account
            </span>
          </div>
          {/* Meta cells */}
          {[
            ["Date", data.statementDate],
            ["Period", periodLabel],
            ["Currency", "AED"],
          ].map(([label, val]) => (
            <div key={label} className="flex-1 border-l border-slate-200 px-2.5 py-1.5">
              <p className="text-xs uppercase text-slate-400 tracking-wide">{label}</p>
              <p className="font-semibold text-slate-700 leading-tight">{val}</p>
            </div>
          ))}
        </div>

        {/* ── Client + Account Summary ── */}
        <div className="flex gap-2 mb-4 text-xs">
          {/* Client info */}
          <div className="flex-1 border border-slate-200 rounded px-3 py-2">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Client</p>
            <p className="text-sm font-bold uppercase text-slate-800 leading-tight">{data.entity.name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-[11px] text-slate-500">
              {data.entity.licenseNo && (
                <span><span className="text-slate-400">TL:</span> {data.entity.licenseNo}</span>
              )}
              {data.entity.phone && (
                <span><span className="text-slate-400">Tel:</span> {data.entity.phone}</span>
              )}
              {data.entity.email && (
                <span>{data.entity.email}</span>
              )}
            </div>
          </div>

          {/* Account summary — 4 numbers inline */}
          <div className="flex border border-slate-200 rounded overflow-hidden divide-x divide-slate-200 text-center">
            {[
              { label: "Opening",     val: data.openingBalance, cls: "text-slate-700" },
              { label: "Charges",     val: data.totalDebits,    cls: "text-emerald-700" },
              { label: "Payments",    val: data.totalCredits,   cls: "text-rose-600" },
              { label: "Outstanding", val: data.closingBalance, cls: data.closingBalance > 0 ? "text-slate-900 font-bold" : "text-emerald-700 font-bold", bg: "bg-slate-50" },
            ].map(({ label, val, cls, bg }) => (
              <div key={label} className={`px-3 py-2 ${bg ?? ""}`}>
                <p className="text-xs uppercase text-slate-400 tracking-wide whitespace-nowrap">{label}</p>
                <p className={`text-xs font-semibold mt-0.5 ${cls}`}>
                  {Math.abs(val).toFixed(2)}
                  {label === "Outstanding" && val < 0 && (
                    <span className="text-xs font-normal text-slate-400"> CR</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Transaction table ── */}
        <table className="w-full text-xs border-collapse mb-3">
          <thead>
            <tr className="bg-slate-700 text-white">
              <th className="px-2 py-1.5 text-left font-semibold">Date</th>
              {cols.jobNo         && <th className="px-2 py-1.5 text-left font-semibold">Job No</th>}
              {cols.refNo         && <th className="px-2 py-1.5 text-left font-semibold">Ref No</th>}
              {cols.transaction   && <th className="px-2 py-1.5 text-left font-semibold">Type</th>}
              {cols.paymentMethod && <th className="px-2 py-1.5 text-left font-semibold">Method</th>}
              <th className="px-2 py-1.5 text-left font-semibold">Particular</th>
              {cols.remarks       && <th className="px-2 py-1.5 text-left font-semibold">Remarks</th>}
              <th className="px-2 py-1.5 text-right font-semibold">Debit</th>
              <th className="px-2 py-1.5 text-right font-semibold">Credit</th>
              <th className="px-2 py-1.5 text-right font-semibold">Balance (AED)</th>
            </tr>
          </thead>
          <tbody>
            {/* Opening balance */}
            <tr className="bg-slate-50 border-b border-slate-100">
              <td className="px-2 py-1 text-slate-400 italic" colSpan={
                1 +
                (cols.jobNo ? 1 : 0) +
                (cols.refNo ? 1 : 0) +
                (cols.transaction ? 1 : 0) +
                (cols.paymentMethod ? 1 : 0) +
                1 +
                (cols.remarks ? 1 : 0) +
                2
              }>Opening Balance</td>
              <td className="px-2 py-1 text-right font-semibold text-slate-600">
                {fmtSigned(data.openingBalance)}
              </td>
            </tr>

            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={99} className="px-2 py-4 text-center text-slate-400 italic">
                  No transactions in this period.
                </td>
              </tr>
            ) : data.rows.map((row, i) => (
              <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                <td className="px-2 py-1 whitespace-nowrap text-slate-600">{row.date}</td>
                {cols.jobNo         && <td className="px-2 py-1 font-mono text-slate-500">{row.jobNo ?? "—"}</td>}
                {cols.refNo         && <td className="px-2 py-1 font-mono text-slate-700">{row.refNo ?? "—"}</td>}
                {cols.transaction   && (
                  <td className="px-2 py-1">
                    <span className={`rounded px-1 py-0.5 text-[11px] font-semibold uppercase ${
                      row.transaction === "Invoice"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-600"
                    }`}>{row.transaction}</span>
                  </td>
                )}
                {cols.paymentMethod && (
                  <td className="px-2 py-1 text-slate-600 whitespace-nowrap">
                    {row.paymentMethod ?? "—"}
                  </td>
                )}
                <td className="px-2 py-1 text-slate-600">{row.particular || "—"}</td>
                {cols.remarks && (
                  <td className="px-2 py-1 text-slate-500">{row.remarks ?? "—"}</td>
                )}
                <td className="px-2 py-1 text-right text-emerald-700 font-medium">{row.debit != null ? fmt(row.debit) : ""}</td>
                <td className="px-2 py-1 text-right text-rose-600 font-medium">{row.credit != null ? fmt(row.credit) : ""}</td>
                <td className="px-2 py-1 text-right font-semibold text-slate-800">{fmtSigned(row.balance)}</td>
              </tr>
            ))}
            {/* Totals row — in tbody so it never repeats on print page breaks */}
            <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
              <td className="px-2 py-1.5 text-slate-600 uppercase text-[11px] tracking-wide" colSpan={
                1 +
                (cols.jobNo ? 1 : 0) +
                (cols.refNo ? 1 : 0) +
                (cols.transaction ? 1 : 0) +
                (cols.paymentMethod ? 1 : 0) +
                1 +
                (cols.remarks ? 1 : 0)
              }>Total</td>
              <td className="px-2 py-1.5 text-right text-emerald-700">{data.totalDebits.toFixed(2)}</td>
              <td className="px-2 py-1.5 text-right text-rose-600">{data.totalCredits.toFixed(2)}</td>
              <td className="px-2 py-1.5 text-right text-slate-800">{fmtSigned(data.closingBalance)}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Notes + Aging side by side ── */}
        <div className={`flex gap-3 mb-4 text-xs ${showAging ? "" : ""}`}>
          {/* Notes */}
          <div className="flex-1 border border-slate-100 rounded px-3 py-2 text-slate-500 leading-relaxed">
            <p className="font-semibold text-[11px] uppercase tracking-wide text-slate-700 mb-1">Notes</p>
            <ul className="space-y-0.5 list-disc list-inside text-[11px]">
              <li>This statement reflects all transactions posted during the selected period.</li>
              <li>Any discrepancy should be reported within 7 days of the statement date.</li>
              <li>If payment has been made, please share confirmation for reconciliation.</li>
            </ul>
          </div>

          {/* Aging summary */}
          {showAging && (() => {
            const agingTotal = Number(
              (data.aging.current + data.aging.days30 + data.aging.days60 + data.aging.days90 + data.aging.over90).toFixed(2)
            );
            const buckets = [
              { label: "0–30 Days",  key: "current" as const, val: data.aging.current, headerBg: "bg-emerald-600", rowBg: "bg-emerald-50",  textCls: "text-emerald-700" },
              { label: "31–60 Days", key: "days30"  as const, val: data.aging.days30,  headerBg: "bg-yellow-500",  rowBg: "bg-yellow-50",   textCls: "text-yellow-700" },
              { label: "61–90 Days", key: "days60"  as const, val: data.aging.days60,  headerBg: "bg-orange-500",  rowBg: "bg-orange-50",   textCls: "text-orange-700" },
              { label: "91–120 Days",key: "days90"  as const, val: data.aging.days90,  headerBg: "bg-red-500",     rowBg: "bg-red-50",      textCls: "text-red-600"   },
              { label: "120+ Days",  key: "over90"  as const, val: data.aging.over90,  headerBg: "bg-red-900",     rowBg: "bg-red-100",     textCls: "text-red-800"   },
            ];
            return (
              <div className="border border-slate-200 rounded overflow-hidden min-w-[300px]">
                <div className="bg-slate-700 text-white px-3 py-1.5 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-widest font-semibold">Aging Summary</p>
                  <p className="text-[11px] text-slate-300">Outstanding: <span className="font-bold text-white">{agingTotal.toFixed(2)}</span></p>
                </div>
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr>
                      {buckets.map(({ label, headerBg }) => (
                        <th key={label} className={`px-2 py-1 text-center font-semibold text-white text-xs ${headerBg}`}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {buckets.map(({ label, val, rowBg, textCls }) => (
                        <td key={label} className={`px-2 py-1.5 text-center border-t border-white/50 ${rowBg}`}>
                          <span className={`font-bold text-xs ${val > 0 ? textCls : "text-slate-300"}`}>
                            {val.toFixed(2)}
                          </span>
                        </td>
                      ))}
                    </tr>
                    {/* Mini bar visualization */}
                    {agingTotal > 0 && (
                      <tr>
                        {buckets.map(({ label, val, headerBg }) => (
                          <td key={label} className="px-1 pb-1 pt-0.5">
                            <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${headerBg}`}
                                style={{ width: `${Math.min(100, (val / agingTotal) * 100)}%` }}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-slate-200 pt-2 flex items-end justify-between text-[11px] text-slate-400">
          <span>Prepared By: ____________________</span>
          <div className="text-center">
            <p className="font-bold text-xs text-slate-600 uppercase tracking-wide">
              ZAAD Business Documents Services
            </p>
            <p>Generated: {data.statementDate}</p>
          </div>
          <span>Authorized Signatory: ____________________</span>
        </div>
      </div>
    </>
  );
}
