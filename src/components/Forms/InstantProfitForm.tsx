"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import clsx from "clsx";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  FiCheckCircle,
  FiChevronDown,
  FiDollarSign,
  FiFileText,
  FiHash,
  FiPlus,
  FiUserPlus,
  FiCircle,
  FiTrendingUp,
} from "react-icons/fi";
import { debounce } from "lodash";

import EntityAvatar from "../common/EntityAvatar";

type TEntitySearchType = "company" | "employee" | "individual";

type TBaseData = {
  _id: string;
  name: string;
  color?: string;
  entityType: TEntitySearchType;
};

type PaymentMethodOption = {
  value: string;
  label: string;
  color?: string;
  icon?: string;
};

type PaymentStatusOption = {
  value: string;
  label: string;
  color?: string;
  appliesTo?: "income" | "expense" | "both";
};

const inputClass =
  "w-full appearance-none rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900";
const labelClass =
  "mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";

const InstantProfitForm = () => {
  const router = useRouter();
  const [searchEntityType, setSearchEntityType] = useState<TEntitySearchType | "">("");
  const [searchValue, setSearchValue] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<Array<TBaseData>>([]);
  const [selectedEntity, setSelectedEntity] = useState<TBaseData | null>(null);
  const [particular, setParticular] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethodTemplate, setPaymentMethodTemplate] = useState("");
  const [paymentStatusTemplate, setPaymentStatusTemplate] = useState("");
  const [suffix, setSuffix] = useState("");
  const [number, setNumber] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [statuses, setStatuses] = useState<PaymentStatusOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [prevRes, methodsRes, statusRes] = await Promise.all([
          axios.get("/api/payment/prev"),
          axios.get("/api/templates", { params: { type: "payment" } }),
          axios.get("/api/templates", { params: { type: "payment-status" } }),
        ]);

        setNumber(Number(prevRes?.data?.number || 0) + 1);
        setSuffix(String(prevRes?.data?.suffix || ""));

        const methodOptions = (methodsRes.data?.options || []).map((item: any) => ({
          value: item.id,
          label: item.label || item.method,
          color: item.color,
          icon: item.icon,
        }));
        setMethods(methodOptions);
        setPaymentMethodTemplate(methodOptions[0]?.value || "");

        const statusOptions = (statusRes.data?.options || []).map((item: any) => ({
          value: item.id,
          label: item.label || item.status,
          color: item.color,
          appliesTo: item.appliesTo || "both",
        }));
        setStatuses(statusOptions);
        const nextStatus =
          statusOptions.find((item) => item.appliesTo === "both" || item.appliesTo === "income")?.value || "";
        setPaymentStatusTemplate(nextStatus);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load instant profit form data");
      }
    };

    load();
  }, []);

  const selectedMethodMeta = useMemo(
    () => methods.find((method) => method.value === paymentMethodTemplate),
    [methods, paymentMethodTemplate],
  );

  const selectedStatusMeta = useMemo(
    () => statuses.find((status) => status.value === paymentStatusTemplate),
    [statuses, paymentStatusTemplate],
  );

  const fetchSearchSuggestions = useCallback(async (inputValue: string, entityType: TEntitySearchType | "") => {
    if (!inputValue || !entityType) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const { data } = await axios.get<TBaseData[]>(`/api/${entityType}/search/${inputValue}`);
      setSearchSuggestions((data || []).map((item) => ({ ...item, entityType })));
    } catch (error) {
      console.error(error);
      setSearchSuggestions([]);
    }
  }, []);

  const debounceSearch = useMemo(() => debounce(fetchSearchSuggestions, 300), [fetchSearchSuggestions]);

  useEffect(() => {
    return () => debounceSearch.cancel();
  }, [debounceSearch]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedEntity?._id) {
      toast.error("Please select a client");
      return;
    }
    if (!particular.trim()) {
      toast.error("Particular is required");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!paymentMethodTemplate) {
      toast.error("Please select a payment method");
      return;
    }
    if (!paymentStatusTemplate) {
      toast.error("Please select a payment status");
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post("/api/payment/profit", {
        type: "income",
        recordKind: "instant_profit",
        entity: selectedEntity._id,
        particular: particular.trim(),
        amount: Number(amount),
        paymentMethodTemplate,
        paymentStatusTemplate,
        suffix: suffix.trim(),
        number,
        remarks: remarks.trim(),
        entityType: selectedEntity.entityType,
      });
      toast.success("Instant profit saved");
      router.push("/accounts/transactions");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to save instant profit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-3xl border border-violet-200/80 bg-white shadow-xl shadow-violet-200/30 dark:border-violet-900/40 dark:bg-slate-900/50 dark:shadow-none">
        <div className="border-b border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 sm:p-7 dark:border-violet-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20">
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/60 bg-violet-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700 dark:border-violet-700/40 dark:bg-violet-900/30 dark:text-violet-300">
            <FiTrendingUp />
            Special Entry
          </p>
          <h3 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
            Add Instant Profit
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Dedicated profit form with automatic grouping handled by the backend.
          </p>
        </div>

        <div className="p-6 sm:p-7">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}>Entity Type</label>
              <div className="relative z-20">
                <select
                  value={searchEntityType}
                  onChange={(event) => {
                    setSearchEntityType(event.target.value as TEntitySearchType | "");
                    setSearchValue("");
                    setSelectedEntity(null);
                    setSearchSuggestions([]);
                  }}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select entity type
                  </option>
                  <option value="company">Company</option>
                  <option value="employee">Employee</option>
                  <option value="individual">Individual</option>
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiChevronDown />
                </span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Client</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiUserPlus />
                </span>
                <input
                  value={searchValue}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSearchValue(nextValue);
                    if (searchEntityType) {
                      debounceSearch(nextValue, searchEntityType);
                    }
                  }}
                  placeholder={searchEntityType ? `Search ${searchEntityType}...` : "Select entity type first"}
                  disabled={!searchEntityType}
                  className={clsx(inputClass, "pl-11")}
                />

                {searchSuggestions.length > 0 && (
                  <ul className="absolute z-30 mt-2 w-full max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    {searchSuggestions.map((entity, key) => (
                      <li
                        key={key}
                        onClick={() => {
                          setSelectedEntity(entity);
                          setSearchValue(entity.name);
                          setSearchSuggestions([]);
                        }}
                        className="cursor-pointer px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-600 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <EntityAvatar name={entity.name} color={entity.color} size="sm" />
                          <div>
                            <p className="font-medium">{entity.name}</p>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400">{entity.entityType}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {selectedEntity && (
              <div className="md:col-span-2">
                <label className={labelClass}>Selected Client</label>
                <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50/70 px-4 py-3 dark:border-violet-900/40 dark:bg-violet-900/10">
                  <EntityAvatar name={selectedEntity.name} color={selectedEntity.color} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedEntity.name}</p>
                    <p className="text-[11px] uppercase tracking-wider text-violet-700 dark:text-violet-300">{selectedEntity.entityType}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className={labelClass}>Particular</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiFileText />
                </span>
                <input
                  value={particular}
                  onChange={(event) => setParticular(event.target.value)}
                  className={clsx(inputClass, "pl-11")}
                  placeholder="E.g., Service fee adjustment"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Payment Method</label>
              <div className="relative z-20">
                <select value={paymentMethodTemplate} onChange={(event) => setPaymentMethodTemplate(event.target.value)} className={inputClass}>
                  <option value="" disabled>
                    Select method
                  </option>
                  {methods.map((method) => (
                    <option key={method.value} value={method.value}>{method.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiChevronDown />
                </span>
              </div>
              {selectedMethodMeta && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{selectedMethodMeta.label}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Payment Status</label>
              <div className="relative z-20">
                <select value={paymentStatusTemplate} onChange={(event) => setPaymentStatusTemplate(event.target.value)} className={inputClass}>
                  <option value="" disabled>
                    Select status
                  </option>
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiChevronDown />
                </span>
              </div>
              {selectedStatusMeta && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{selectedStatusMeta.label}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Amount (AED)</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiDollarSign />
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  onWheel={(event: any) => event.target.blur()}
                  className={clsx(inputClass, "pl-11")}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Transaction Suffix</label>
              <input value={suffix} onChange={(event) => setSuffix(event.target.value)} className={clsx(inputClass, "uppercase")} placeholder="TRN-" />
            </div>

            <div>
              <label className={labelClass}>Transaction Number</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiHash />
                </span>
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-4 font-bold text-white shadow-sm transition-all hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <FiCheckCircle className="text-xl" />
              {isSubmitting ? "Saving..." : "Add Instant Profit"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default InstantProfitForm;