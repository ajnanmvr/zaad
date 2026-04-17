"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import clsx from "clsx";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { FiChevronDown, FiCheckCircle, FiDollarSign, FiHash, FiTag } from "react-icons/fi";

type CompanyRecordType = "income" | "expense";

type PaymentMethodOption = {
  value: string;
  label: string;
};

type PaymentStatusOption = {
  value: string;
  label: string;
  appliesTo?: "income" | "expense" | "both";
};

const inputClass =
  "w-full appearance-none rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900";
const labelClass =
  "mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";

const pickDefaultStatus = (
  type: CompanyRecordType,
  options: PaymentStatusOption[],
) => {
  const normalized = options.map((item) => ({
    ...item,
    normalizedLabel: String(item.label || "").trim().toLowerCase(),
  }));

  const preferredByType =
    type === "income"
      ? ["ready cash", "credit (income)", "credit", "advance"]
      : ["debit (pay out)", "debit", "ready cash"];

  for (const preferred of preferredByType) {
    const match = normalized.find(
      (item) =>
        item.normalizedLabel === preferred &&
        (item.appliesTo === "both" || item.appliesTo === type),
    );
    if (match) return match.value;
  }

  const applicable = normalized.find(
    (item) => item.appliesTo === "both" || item.appliesTo === type,
  );

  return applicable?.value || "";
};

const CompanyRecordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType =
    searchParams.get("type") === "expense" ? "expense" : "income";

  const [recordType, setRecordType] = useState<CompanyRecordType>(initialType);
  const [particular, setParticular] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethodTemplate, setPaymentMethodTemplate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [suffix, setSuffix] = useState("");
  const [number, setNumber] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [statuses, setStatuses] = useState<PaymentStatusOption[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [prevRes, methodsRes, statusRes] = await Promise.all([
          axios.get("/api/payment/prev"),
          axios.get("/api/templates", { params: { type: "payment" } }),
          axios.get("/api/templates", { params: { type: "payment-status" } }),
        ]);

        const prevNumber = Number(prevRes?.data?.number || 0);
        const prevSuffix = String(prevRes?.data?.suffix || "");
        setNumber(prevNumber + 1);
        setSuffix(prevSuffix);

        const methodOptions = (methodsRes?.data?.options || []).map((item: any) => ({
          value: item.id,
          label: item.label || item.method,
        }));
        setMethods(methodOptions);
        if (methodOptions.length > 0) {
          setPaymentMethodTemplate(methodOptions[0].value);
        }

        const statusOptions = (statusRes?.data?.options || []).map((item: any) => ({
          value: item.id,
          label: item.label || item.status,
          appliesTo: item.appliesTo || "both",
        }));
        setStatuses(statusOptions);
      } catch (error) {
        console.error("Failed loading company record form dependencies", error);
        toast.error("Failed to load payment templates");
      }
    };

    fetchInitialData();
  }, []);

  const paymentStatusTemplate = useMemo(
    () => pickDefaultStatus(recordType, statuses),
    [recordType, statuses],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!particular.trim()) {
      toast.error("Particular is required");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!paymentMethodTemplate) {
      toast.error("Payment method is required");
      return;
    }
    if (!paymentStatusTemplate) {
      toast.error("A payment status template is required in settings");
      return;
    }
    if (recordType === "expense" && !category.trim()) {
      toast.error("Category is required for company expense");
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post("/api/payment", {
        type: recordType,
        recordKind: "company",
        particular: particular.trim(),
        category: recordType === "expense" ? category.trim() : undefined,
        amount: Number(amount),
        paymentMethodTemplate,
        paymentStatusTemplate,
        remarks: remarks.trim(),
        suffix: suffix.trim(),
        number,
      });

      toast.success("Company record created");
      router.push("/accounts/transactions/self");
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to create company record";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none">
        <div
          className={clsx(
            "border-b p-6 sm:p-7",
            recordType === "income"
              ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20"
              : "border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:border-orange-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/20",
          )}
        >
          <p
            className={clsx(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider",
              recordType === "income"
                ? "border-emerald-300/60 bg-emerald-100/80 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "border-orange-300/60 bg-orange-100/80 text-orange-700 dark:border-orange-700/40 dark:bg-orange-900/30 dark:text-orange-300",
            )}
          >
            {recordType === "income" ? <FiCheckCircle /> : <FiDollarSign />}
            Company Record
          </p>
          <h3 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
            Create Company {recordType === "income" ? "Income" : "Expense"}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Dedicated company-only flow with type switcher and simplified fields.
          </p>
        </div>

        <div className="p-6 sm:p-7">
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Record Type
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <input
                  type="radio"
                  checked={recordType === "income"}
                  onChange={() => setRecordType("income")}
                  className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Income
              </label>
              <label className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <input
                  type="radio"
                  checked={recordType === "expense"}
                  onChange={() => setRecordType("expense")}
                  className="h-4 w-4 border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                Expense
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}>Particular</label>
              <input
                value={particular}
                onChange={(event) => setParticular(event.target.value)}
                className={inputClass}
                placeholder="E.g., Vendor settlement, New contract amount"
              />
            </div>

            {recordType === "expense" && (
              <div>
                <label className={labelClass}>Category</label>
                <div className="relative">
                  <FiTag className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className={clsx(inputClass, "pl-11")}
                    placeholder="E.g., Operations, Rent, Utilities"
                  />
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>Payment Method</label>
              <div className="relative z-20">
                <select
                  value={paymentMethodTemplate}
                  onChange={(event) => setPaymentMethodTemplate(event.target.value)}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select method
                  </option>
                  {methods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiChevronDown />
                </span>
              </div>
            </div>

            <div>
              <label className={labelClass}>Amount (AED)</label>
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                onWheel={(event: any) => event.target.blur()}
                className={inputClass}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className={labelClass}>Transaction Suffix</label>
              <input
                value={suffix}
                onChange={(event) => setSuffix(event.target.value)}
                className={clsx(inputClass, "uppercase")}
                placeholder="TRN-"
              />
            </div>

            <div>
              <label className={labelClass}>Transaction Number</label>
              <div className="relative">
                <FiHash className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  value={number}
                  onChange={(event) => setNumber(Number(event.target.value || 0))}
                  onWheel={(event: any) => event.target.blur()}
                  className={clsx(inputClass, "pl-11")}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Remarks</label>
              <textarea
                rows={4}
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                className={clsx(inputClass, "resize-y")}
                placeholder="Optional note"
              />
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className={clsx(
                "flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
                recordType === "income"
                  ? "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                  : "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
              )}
            >
              {recordType === "income" ? <FiCheckCircle className="text-xl" /> : <FiDollarSign className="text-xl" />}
              {isSubmitting ? "Saving..." : `Create Company ${recordType === "income" ? "Income" : "Expense"}`}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CompanyRecordForm;