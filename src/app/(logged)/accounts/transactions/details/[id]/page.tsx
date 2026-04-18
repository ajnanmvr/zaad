"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { TRecordList } from "@/types/records";
import axios from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { formatDateTime, formatRelativeDate } from "@/utils/dateUtils";
import clsx from "clsx";
import PaymentMethodBadge from "@/components/common/PaymentMethodBadge";
import UsernameWithIcon from "@/components/common/UsernameWithIcon";

import toast from "react-hot-toast";
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
  FiTag,
  FiTrendingDown,
  FiTrendingUp,
  FiUser,
  FiTrash2,
  FiMessageSquare,
  FiBox,
  FiFileText,
  FiBookmark
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

const getClientHref = (record?: TRecordList) => {
  if (!record?.client) return "/accounts/transactions";
  if (record.client.type === "self") return "/accounts/transactions/self";
  if (["company", "employee", "individual"].includes(String(record.client.type || ""))) {
    return `/${record.client.type}/${record.client.id}/details`;
  }
  return "/accounts/transactions";
};

const TransactionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

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

  const { data, isLoading, isError } = useQuery<{ record: TRecordList & Record<string, any> }>({
    queryKey: ["payment-details", id],
    queryFn: async () => {
      const response = await axios.get(`/api/payment/${id}/details`);
      return response.data;
    },
    enabled: Boolean(id),
  });

  const record = data?.record;
  const isOfficeRecord = record?.recordKind === "office_records";

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/payment/${id}`);
    },
    onSuccess: async () => {
      toast.success("Transaction moved to bin");
      await queryClient.invalidateQueries({ queryKey: ["payment-bin"] });
      await queryClient.invalidateQueries({ queryKey: ["payment"] });
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["profits"] });
      router.push("/accounts/transactions/bin");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || error?.response?.data?.message || "Failed to delete transaction";
      toast.error(message);
    },
  });

  const renderTableRow = (label: string, value: React.ReactNode, icon: React.ReactNode) => (
    <tr className="group border-b border-slate-200 transition-colors hover:bg-slate-50/50 last:border-b-0 dark:border-slate-800/80 dark:hover:bg-slate-800/30">
      <td className="w-1/3 py-4 pl-6 pr-4 align-top text-sm font-semibold text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 opacity-70 group-hover:text-cyan-500 group-hover:opacity-100 transition-colors">
            {icon}
          </span>
          {label}
        </div>
      </td>
      <td className="py-4 pr-6 text-sm font-medium text-slate-900 dark:text-slate-100">
        {value}
      </td>
    </tr>
  );

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
              Record Data
            </p>
            <h2 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              Payment Record Detail
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/accounts/transactions"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FiArrowLeft className="text-base" />
              Back
            </Link>
            {!isOfficeRecord ? (
              <Link
                href={getClientHref(record)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <FiExternalLink /> View Entity
              </Link>
            ) : null}
            <Link
              href={`/accounts/transactions/edit/${record?.type}/${record?.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
            >
              <FiEdit3 /> Edit Record
            </Link>
            <button
              type="button"
              onClick={() => {
                const recordLabel = `${record?.suffix || ""}${record?.number || ""}`.trim() || "this transaction";
                if (window.confirm(`Move ${recordLabel} to the bin?`)) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
            >
              <FiTrash2 /> Delete Record
            </button>
          </div>
        </div>
      </section>



      <section className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white py-20 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
            <FiLoader className="animate-spin text-2xl" />
            <span className="font-medium">Loading full record detail...</span>
          </div>
        ) : isError || !record ? (
          <div className="rounded-3xl border border-rose-200 bg-white py-20 text-center text-sm font-medium text-rose-600 shadow-sm dark:border-rose-900/50 dark:bg-slate-900/50 dark:text-rose-400">
            Failed to load transaction details.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-slate-800/80 dark:bg-slate-800/20">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Detailed Data Table
                </h3>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left">
                  <tbody>
                    {renderTableRow(
                      "Transaction ID",
                      <span className="inline-flex items-center gap-2 font-black text-cyan-600 dark:text-cyan-400">
                        <FiHash className="text-cyan-400 dark:text-cyan-600" />
                        {(record.suffix || "") + (record.number || "")}
                      </span>,
                      <FiHash />
                    )}
                    
                    {renderTableRow(
                      "Record Kind",
                      <span className="capitalize">{record.recordKind?.replace(/_/g, " ") || "-"}</span>,
                      <FiBox />
                    )}

                    {renderTableRow(
                      "Type",
                      <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase", record.type === "income" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300")}>
                        {record.type === "income" ? <FiTrendingUp /> : <FiTrendingDown />}
                        {record.type}
                      </span>,
                      record.type === "income" ? <FiTrendingUp /> : <FiTrendingDown />
                    )}

                    {renderTableRow(
                      "Amount",
                      <span className="font-black text-slate-900 dark:text-white">
                        {record.amount} <span className="text-slate-500 dark:text-slate-400">AED</span>
                      </span>,
                      <FiDollarSign />
                    )}

                    {record.serviceFee !== undefined && record.serviceFee !== null && renderTableRow(
                      "Service Fee",
                      <span className="font-medium">
                        {record.serviceFee} <span className="text-slate-500 dark:text-slate-400">AED</span>
                      </span>,
                      <FiTag />
                    )}

                    {renderTableRow(
                      isOfficeRecord ? "Category" : "Client / Entity",
                      isOfficeRecord ? (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {record.categoryName || "Office"}
                        </span>
                      ) : (
                        <Link
                          href={getClientHref(record)}
                          className="inline-flex items-center gap-2 font-semibold text-cyan-700 transition hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                        >
                          {record.client?.name || "Unknown"}
                          <FiExternalLink className="h-3.5 w-3.5" />
                          {record.client?.type && (
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">
                              ({record.client.type})
                            </span>
                          )}
                        </Link>
                      ),
                      isOfficeRecord ? <FiTag /> : <FiUser />
                    )}

                    {renderTableRow(
                      "Particular",
                      <div className="max-w-prose whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
                        {record.particular || "-"}
                      </div>,
                      <FiFileText />
                    )}

                    {renderTableRow(
                      "Remarks",
                      <div className="max-w-prose whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
                        {record.remarks || "-"}
                      </div>,
                      <FiMessageSquare />
                    )}

                    {renderTableRow(
                      "Payment Method",
                      record.method ? (
                        <PaymentMethodBadge
                          label={paymentMethodMap[record.method]?.label || record.method || "-"}
                          color={paymentMethodMap[record.method]?.color}
                          icon={paymentMethodMap[record.method]?.icon}
                          size="sm"
                        />
                      ) : "-",
                      <FiCreditCard />
                    )}

                    {renderTableRow(
                      "Status",
                      record.status ? renderBadge(record.status, "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700") : "-",
                      <FiBookmark />
                    )}

                    {record.transferGroupId && renderTableRow(
                      "Transfer Group ID",
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                        {record.transferGroupId}
                      </span>,
                      <FiHash />
                    )}

                    {renderTableRow(
                      "Date",
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{formatDateTime(record.createdAt || record.dateTime || null)}</span>
                        <span className="text-xs text-slate-500">{formatRelativeDate(record.createdAt || record.dateTime || null)}</span>
                      </div>,
                      <FiCalendar />
                    )}

                    {renderTableRow(
                      "Created By",
                      <UsernameWithIcon
                        username={record.creator}
                        fullname={record.creatorFullname}
                        fallback="Unknown"
                        className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                        iconClassName="text-amber-600 dark:text-amber-300"
                      />,
                      <FiUser />
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-slate-800/80 dark:bg-slate-800/20">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  <FiActivity className="text-cyan-500" />
                  Activity Timeline
                </h3>
              </div>
              <div className="p-6">
                {!record.activityLog?.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-400">
                    No activity recorded for this transaction yet.
                  </div>
                ) : (
                  <div className="relative border-l border-slate-200 pl-6 dark:border-slate-700">
                    <div className="space-y-8">
                      {record.activityLog
                        .slice()
                        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                        .map((entry, index) => {
                          const actionClass = actionColorMap[entry.action] || "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";

                          return (
                            <div key={`${entry.action}-${entry.at}-${index}`} className="relative">
                              <div className="absolute -left-[35px] mt-1.5 h-4 w-4 rounded-full border-4 border-white bg-slate-300 dark:border-slate-900 dark:bg-slate-600"></div>
                              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800/40">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                  <span className={clsx("inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider", actionClass)}>
                                    {entry.action}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    <FiClock />
                                    {formatDateTime(entry.at)}
                                  </span>
                                </div>

                                <div className="mb-2 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                  <span className="font-semibold text-slate-500">Actor:</span>
                                  <UsernameWithIcon
                                    username={entry.byUsername}
                                    fullname={entry.byFullname}
                                    fallback="Unknown"
                                    className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                                    iconClassName="text-slate-500 dark:text-slate-400"
                                  />
                                </div>

                                {entry.details && (
                                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="font-semibold text-slate-500 dark:text-slate-500">Note: </span>
                                    {entry.details}
                                  </p>
                                )}

                                {!!entry.previousValues && !!entry.newValues && (
                                  <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Property Changes</p>
                                    <div className="grid gap-3">
                                      {Object.keys(entry.newValues).map((field) => {
                                        const previousValue = entry.previousValues?.[field];
                                        const newValue = entry.newValues?.[field];

                                        return (
                                          <div key={`${entry.at}-${field}`} className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-sm">
                                            <div className="flex flex-col gap-1 rounded-lg border border-rose-100 bg-white p-3 shadow-sm dark:border-rose-900/30 dark:bg-slate-800">
                                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">{toLabel(field)} (Old)</span>
                                              <span className="font-medium text-slate-700 line-through opacity-70 dark:text-slate-300">{toDisplayValue(previousValue)}</span>
                                            </div>
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                                              <FiArrowLeft className="rotate-180" />
                                            </div>
                                            <div className="flex flex-col gap-1 rounded-lg border border-emerald-100 bg-white p-3 shadow-sm dark:border-emerald-900/30 dark:bg-slate-800">
                                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">{toLabel(field)} (New)</span>
                                              <span className="font-medium text-slate-900 dark:text-slate-100">{toDisplayValue(newValue)}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
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
