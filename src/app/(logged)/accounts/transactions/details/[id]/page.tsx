"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { TRecordList } from "@/types/records";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatDateTime, formatRelativeDate } from "@/utils/dateUtils";
import clsx from "clsx";
import PaymentMethodBadge from "@/components/common/PaymentMethodBadge";
import {
  FiActivity,
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiEdit3,
  FiExternalLink,
  FiHash,
  FiInfo,
  FiLoader,
  FiChevronDown,
  FiChevronUp,
  FiTag,
  FiTrendingDown,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi";

const renderBadge = (status: string | undefined, colorClass: string) => (
  <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", colorClass)}>
    {status}
  </span>
);

const actionColorMap: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  update: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  delete: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  recover: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
};

function toLabel(field: string) {
  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function toDisplayValue(value: any) {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const definitionMap: Record<string, string> = {
  createdBy: "System user who initially created this transaction.",
  method: "Payment channel used for this transaction (cash, bank, tasdeed, etc.).",
  status: "Operational state of this transaction used by accounting workflows.",
  amount: "Final transaction amount in AED.",
  serviceFee: "Fee captured separately, usually on expense-type records.",
  particular: "Business context or purpose note of the transaction.",
  type: "Income increases inflow; expense captures outflow.",
};

function getDefinition(field: string) {
  return definitionMap[field] || "Audited transaction field captured for traceability.";
}

const getClientHref = (record?: TRecordList) => {
  if (!record?.client) return "/accounts/transactions";
  if (record.client.type === "self") return "/accounts/transactions/self";
  return `/${record.client.type}/${record.client.id}`;
};

const TransactionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [showGuide, setShowGuide] = useState(false);

  const { data: paymentMethodOptions = [] } = useQuery<Array<{ value: string; label: string; color?: string; icon?: string }>>({
    queryKey: ["payment-method-templates"],
    queryFn: async () => {
      const { data } = await axios.get("/api/templates", { params: { type: "payment" } });
      return (data?.options || []).map((item: any) => ({
        value: item.method,
        label: item.label || item.method,
        color: item.color,
        icon: item.icon,
      }));
    },
  });

  const paymentMethodMap = paymentMethodOptions.reduce<Record<string, { label: string; color?: string; icon?: string }>>((acc, item) => {
    acc[item.value] = item;
    return acc;
  }, {});

  const { data, isLoading, isError } = useQuery<{ record: TRecordList }>({
    queryKey: ["payment-details", id],
    queryFn: async () => {
      const response = await axios.get(`/api/payment/${id}/details`);
      return response.data;
    },
    enabled: Boolean(id),
  });

  const record = data?.record;

  return (
    <>
      <Breadcrumb pageName="Transaction Details" />

      <section className="relative overflow-hidden rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-5 shadow-sm dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-14 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300">
              <FiInfo />
              Transaction Insight
            </p>
            <h2 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              Payment Details
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Complete timeline and field-level change history for this record.
            </p>
          </div>

          <Link
            href="/accounts/transactions"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FiArrowLeft className="text-base" />
            Back to Transactions
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500 dark:text-slate-400">
            <FiLoader className="animate-spin" />
            Loading transaction details...
          </div>
        ) : isError || !record ? (
          <div className="py-16 text-center text-sm text-rose-600 dark:text-rose-400">
            Failed to load transaction details.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Transaction ID</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-black uppercase text-slate-900 dark:text-slate-100">
                  <FiHash className="text-slate-400" />
                  {(record.suffix || "") + (record.number || "")}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800/40 dark:bg-emerald-900/10">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Amount</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-300">
                  <FiDollarSign className="text-emerald-500" />
                  {record.amount} AED
                </p>
              </div>
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4 dark:border-cyan-800/40 dark:bg-cyan-900/10">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Type</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-slate-900 dark:text-slate-100">
                  {record.type === "income" ? <FiTrendingUp className="text-emerald-500" /> : <FiTrendingDown className="text-rose-500" />}
                  {record.type}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800/40 dark:bg-amber-900/10">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Activity Events</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-slate-900 dark:text-slate-100">
                  <FiActivity className="text-amber-500" />
                  {record.activityLog?.length || 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-4 rounded-2xl border border-fuchsia-200/70 bg-gradient-to-br from-fuchsia-50 via-white to-cyan-50 p-5 shadow-sm dark:border-fuchsia-800/30 dark:from-slate-800 dark:via-slate-900 dark:to-cyan-950/20 lg:col-span-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300">Record Summary</h3>
                  <button
                    type="button"
                    onClick={() => setShowGuide((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-full border border-fuchsia-300/60 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-fuchsia-700 transition hover:bg-fuchsia-50 dark:border-fuchsia-700/40 dark:bg-slate-900/70 dark:text-fuchsia-300"
                    title="Show quick definitions for highlighted fields"
                  >
                    <FiInfo /> Guide {showGuide ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </div>

                {showGuide && (
                  <div className="rounded-xl border border-fuchsia-200 bg-white/90 p-3 text-xs dark:border-fuchsia-700/40 dark:bg-slate-900/70">
                    <p className="mb-2 font-bold uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-300">Field Definitions</p>
                    <div className="space-y-1 text-slate-600 dark:text-slate-300">
                      <p><span className="font-semibold">Created By</span>: {getDefinition("createdBy")}</p>
                      <p><span className="font-semibold">Method</span>: {getDefinition("method")}</p>
                      <p><span className="font-semibold">Status</span>: {getDefinition("status")}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2 dark:border-slate-700">
                    <span className="inline-flex items-center gap-1.5 text-slate-500"><FiUser className="text-slate-400" /> Client</span>
                    <span className="max-w-[65%] text-right font-semibold capitalize text-slate-900 dark:text-slate-100">{record.client?.name || "Unknown"}</span>
                  </div>

                  <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2 dark:border-slate-700">
                    <span className="inline-flex items-center gap-1.5 text-slate-500" title={getDefinition("method")}><FiTag className="text-slate-400" /> Method</span>
                    <PaymentMethodBadge
                      label={paymentMethodMap[record.method || ""]?.label || record.method || "-"}
                      color={paymentMethodMap[record.method || ""]?.color}
                      icon={paymentMethodMap[record.method || ""]?.icon}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2 dark:border-slate-700">
                    <span className="inline-flex items-center gap-1.5 text-slate-500"><FiCalendar className="text-slate-400" /> Date</span>
                    <span className="max-w-[65%] text-right font-medium text-slate-900 dark:text-slate-100">{formatDateTime(record.createdAt || record.dateTime || null)}</span>
                  </div>

                  <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2 dark:border-slate-700">
                    <span className="inline-flex items-center gap-1.5 text-slate-500"><FiClock className="text-slate-400" /> Relative</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{formatRelativeDate(record.createdAt || record.dateTime || null)}</span>
                  </div>

                  <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2 dark:border-slate-700">
                    <span className="inline-flex items-center gap-1.5 text-slate-500" title={getDefinition("createdBy")}><FiUser className="text-slate-400" /> Created By</span>
                    <span
                      title={`${record.creatorFullname || record.creator || "Unknown"} - ${getDefinition("createdBy")}`}
                      className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                    >
                      {record.creator || "Unknown"}
                    </span>
                  </div>

                  {record.status && (
                    <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2 dark:border-slate-700">
                      <span className="inline-flex items-center gap-1.5 text-slate-500" title={getDefinition("status")}><FiCreditCard className="text-slate-400" /> Status</span>
                      {renderBadge(record.status, "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700")}
                    </div>
                  )}

                  {record.particular && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-900/60">
                      <p className="mb-1 font-semibold uppercase tracking-wide text-slate-500">Particular</p>
                      <p className="text-slate-700 dark:text-slate-300">{record.particular}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2">
                  <Link
                    href={getClientHref(record)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <FiExternalLink /> View Client
                  </Link>
                  <Link
                    href={`/accounts/transactions/edit/${record.type}/${record.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                  >
                    <FiEdit3 /> Edit Record
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/30 lg:col-span-2">
                <h3 className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-500">
                  <FiActivity /> Activity Timeline
                </h3>

                {!record.activityLog?.length ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                    No activity recorded for this transaction yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {record.activityLog
                      .slice()
                      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                      .map((entry, index) => {
                        const actionClass = actionColorMap[entry.action] || "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";

                        return (
                          <div key={`${entry.action}-${entry.at}-${index}`} className="relative rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider", actionClass)}>
                                {entry.action}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(entry.at)}</span>
                            </div>

                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              By{" "}
                              <span
                                title={`${entry.byFullname || entry.byUsername || "Unknown"} - System user responsible for this activity event.`}
                                className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                              >
                                {entry.byUsername || "Unknown"}
                              </span>
                            </p>

                            {entry.details && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{entry.details}</p>}

                            {!!entry.previousValues && !!entry.newValues && (
                              <div className="mt-3 space-y-2">
                                {Object.keys(entry.newValues).map((field) => {
                                  const previousValue = entry.previousValues?.[field];
                                  const newValue = entry.newValues?.[field];

                                  return (
                                    <div key={`${entry.at}-${field}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                                      <p
                                        className="mb-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                                        title={getDefinition(field)}
                                      >
                                        {toLabel(field)} <FiInfo className="text-slate-400" />
                                      </p>
                                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                        <div className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                                          <span className="block text-[10px] uppercase tracking-wide opacity-80">Previous</span>
                                          <span className="break-all">{toDisplayValue(previousValue)}</span>
                                        </div>
                                        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                                          <span className="block text-[10px] uppercase tracking-wide opacity-80">New</span>
                                          <span className="break-all">{toDisplayValue(newValue)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default TransactionDetailsPage;
