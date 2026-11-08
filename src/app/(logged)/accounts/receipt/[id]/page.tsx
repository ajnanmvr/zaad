"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import ReactToPrint from "react-to-print";
import { useQuery } from "@tanstack/react-query";
import { FiPrinter } from "react-icons/fi";

import { hasPermission } from "@/auth/permissions";
import { useUserContext } from "@/contexts/UserContext";
import { formatAmountInWords } from "@/utils/numberToWords";

type ReceiptRecord = {
  id: string;
  type: "income" | "expense" | string;
  recordKind?: string;
  particular?: string;
  amount?: string | number;
  serviceFee?: string | number;
  method?: string;
  suffix?: string;
  number?: number | string;
  jobId?: string;
  remarks?: string;
  createdAt?: string;
  creatorFullname?: string;
  creator?: string;
  client?: { name?: string; type?: string } | null;
  categoryName?: string;
};

const money = (value: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dubai",
  });
};

export default function ReceiptPage() {
  const { id }: { id: string } = useParams();
  const router = useRouter();
  const { user } = useUserContext();
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canView = hasPermission(permissions, "payments.read");
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !canView) router.push("/not-permitted");
  }, [user, canView, router]);

  const { data, isLoading, isError } = useQuery<{ record: ReceiptRecord }>({
    queryKey: ["payment-receipt", id],
    queryFn: async () => (await axios.get(`/api/payment/${id}/details`)).data,
    enabled: Boolean(id) && canView,
    retry: false,
  });

  if (!user || !canView || isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  const record = data?.record;
  if (isError || !record) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="font-semibold text-slate-700 dark:text-slate-200">Transaction not found.</p>
      </div>
    );
  }

  const amount = Number(record.amount) || 0;
  const serviceFee = Number(record.serviceFee) || 0;
  const isExpense = record.type === "expense";
  // For expenses the client pays the amount plus our service fee.
  const total = isExpense ? amount + serviceFee : amount;
  const receiptNo = `${record.suffix || ""}${record.number ?? ""}` || "-";
  const kind = record.recordKind || "standard";
  const isOffice = kind === "office_records";
  const isLiability = kind === "liability";

  // Wording and accent colour follow the record: income = receipt (green), expense = voucher (red).
  const variant = isExpense
    ? {
        title: isOffice ? "EXPENSE VOUCHER" : isLiability ? "LIABILITY PAYMENT VOUCHER" : "PAYMENT VOUCHER",
        subtitle: isOffice ? "Office expense" : "Payment made on your behalf",
        partyLabel: isOffice ? "EXPENSE CATEGORY" : "PAYMENT MADE FOR",
        amountLabel: "TOTAL PAID",
        stamp: "PAID",
        forLabel: "BEING PAYMENT MADE FOR",
        methodLabel: "PAID VIA",
        accent: "#e11d48",
        soft: "rgba(225, 29, 72, 0.08)",
      }
    : {
        title: isOffice ? "INCOME RECEIPT" : isLiability ? "LIABILITY RECEIPT" : "PAYMENT RECEIPT",
        subtitle: isOffice ? "Office income" : "Payment received with thanks",
        partyLabel: isOffice ? "INCOME CATEGORY" : "RECEIVED FROM",
        amountLabel: "AMOUNT RECEIVED",
        stamp: "RECEIVED",
        forLabel: "BEING PAYMENT RECEIVED FOR",
        methodLabel: "PAYMENT METHOD",
        accent: "#6A8E4E",
        soft: "rgba(106, 142, 78, 0.12)",
      };
  const partyName = isOffice ? record.categoryName || "Office" : record.client?.name || "-";
  const partySub = isOffice ? "" : record.client?.type || "";

  return (
    <>
      <ReactToPrint
        trigger={() => (
          <p className="flex cursor-pointer items-center justify-center gap-2 rounded-t-md border bg-primary px-4 py-3 text-center text-base font-medium text-white transition-colors duration-300 hover:bg-opacity-90">
            <FiPrinter /> Download / Print Receipt
          </p>
        )}
        content={() => componentRef.current}
        documentTitle={`Receipt-${receiptNo}`}
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

      <div
        ref={componentRef}
        style={{ ["--accent" as any]: variant.accent, ["--accent-soft" as any]: variant.soft }}
        className="bg-invoice flex w-full flex-col items-center bg-contain bg-white p-20 uppercase text-black print:box-border print:min-h-[275mm] print:px-10 print:py-0"
      >
        <Image
          src="/images/invoice/header.png"
          alt="Receipt Header"
          width={1400}
          height={200}
          className="mb-10 h-auto w-full"
          priority
        />

        <div className="flex w-full items-center justify-between gap-4 border-b-2 border-[var(--accent)] pb-3">
          <div>
            <p className="text-2xl font-black tracking-wide text-[var(--accent)]">{variant.title}</p>
            <p className="text-xs">{variant.subtitle}</p>
          </div>
          <div className="text-right text-xs">
            <p>
              {isExpense ? "VOUCHER NO" : "RECEIPT NO"} <span className="ml-1 rounded bg-[var(--accent)] px-2 py-0.5 text-sm font-bold text-white">{receiptNo}</span>
            </p>
            <p className="mt-1">
              DATE <span className="ml-1 text-sm font-bold">{formatDate(record.createdAt)}</span>
            </p>
          </div>
        </div>

        <div className="relative mt-6 flex w-full items-center justify-between overflow-hidden rounded-2xl border-2 border-[var(--accent)] bg-[var(--accent-soft)] px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-widest">{variant.amountLabel}</p>
            <p className="mt-1 text-4xl font-black">
              <span className="mr-2 text-lg font-bold">AED</span>
              {money(total)}
            </p>
          </div>
          <div className="flex h-28 w-28 -rotate-12 flex-col items-center justify-center rounded-full border-4 border-double border-[var(--accent)] text-[var(--accent)]">
            <p className="text-base font-black tracking-widest">{variant.stamp}</p>
            <p className="text-[9px] font-semibold">{formatDate(record.createdAt)}</p>
          </div>
        </div>

        <div className="mt-6 grid w-full grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-[var(--accent)]">{variant.partyLabel}</p>
            <p className="text-base font-bold">{partyName}</p>
            {partySub && <p className="text-xs">{partySub}</p>}
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-[var(--accent)]">{variant.methodLabel}</p>
            <p className="text-base font-bold">{record.method || "-"}</p>
          </div>
          <div className="col-span-2 border-t pt-3">
            <p className="text-[11px] font-semibold tracking-widest text-[var(--accent)]">{variant.forLabel}</p>
            <p className="text-base font-bold">{record.particular || "-"}</p>
            {record.remarks && <p className="mt-1 text-xs normal-case">{record.remarks}</p>}
          </div>
          {record.jobId && (
            <div>
              <p className="text-[11px] font-semibold tracking-widest text-[var(--accent)]">JOB ID</p>
              <p className="text-base font-bold">{record.jobId}</p>
            </div>
          )}
        </div>

        <div className="mt-6 w-full rounded-md bg-[var(--accent)] px-4 py-2 text-center text-sm font-semibold text-white">
          {formatAmountInWords(Number(total.toFixed(2)))}
        </div>

        <p className="mt-10 text-lg font-bold">Thank You!</p>
      </div>
    </>
  );
}
