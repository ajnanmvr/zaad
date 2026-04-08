"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUserContext } from "@/contexts/UserContext";
import { TRecordData } from "@/types/records";
import { TBaseData } from "@/types/types";
import axios from "axios";
import clsx from "clsx";
import { capitalize, debounce } from "lodash";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiCheckCircle,
  FiChevronDown,
  FiDollarSign,
  FiFileText,
  FiHash,
  FiUserPlus
} from "react-icons/fi";
import EntityAvatar from "../common/EntityAvatar";
import PaymentMethodBadge from "../common/PaymentMethodBadge";

const AddRecord = ({ type, edit }: { type: string; edit?: boolean }) => {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user } = useUserContext();
  const lockEntityType = searchParams.get("lockEntityType") || "";
  const lockEntityId = searchParams.get("lockEntityId") || "";
  const lockEntityName = searchParams.get("lockEntityName") || "";
  const returnTo = searchParams.get("returnTo");
  const isLockedEntity = Boolean(!edit && lockEntityType && lockEntityId);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [searchSuggestions, setSearchSuggestions] = useState<
    Array<TBaseData & { entityType: "company" | "employee" | "individual" }>
  >([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedEntitySummary, setSelectedEntitySummary] = useState<{
    id: string;
    name: string;
    color?: string;
    type: string;
  } | null>(null);
  const [clientFee, setClientFee] = useState<string>("");
  const [balance, setBalance] = useState(0);
  const [clientType, setClientType] = useState("");
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<
    Array<{ value: string; label: string; color?: string; icon?: string }>
  >([]);
  const [paymentStatusOptions, setPaymentStatusOptions] = useState<
    Array<{
      value: string;
      label: string;
      color?: string;
      appliesTo?: "income" | "expense" | "both";
    }>
  >([]);
  const [recordData, setRecordData] = useState<TRecordData>({
    createdBy: user?._id,
    type,
    amount: 0,
    invoiceNo: "",
    particular: "",
    remarks: "",
    number: 0,
    suffix: "",
  });

  useEffect(() => {
    if (selectedOption === "self")
      setRecordData((prev) => ({
        ...prev,
        self: "zaad",
        company: undefined,
        employee: undefined,
      }));
  }, [selectedOption]);

  const fetchBalance = useCallback(
    async (Id?: string, entityType?: string) => {
      try {
        const targetClientType = entityType || clientType;
        if (!targetClientType || !Id) return;
        const response = await axios.get<{ balance: number }>(
          `/api/${targetClientType}/balance/${Id}`,
        );
        setBalance(response.data.balance);
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    },
    [clientType],
  );

  useEffect(() => {
    if (!isLockedEntity) return;

    const nextClientType =
      lockEntityType === "company"
        ? "company"
        : lockEntityType === "self"
          ? "self"
          : lockEntityType;
    setSelectedOption(nextClientType);
    setSearchValue(lockEntityName || "");
    setSearchSuggestions([]);
    setClientType(nextClientType);
    setSelectedEntitySummary({
      id: lockEntityId,
      name: lockEntityName || lockEntityId,
      type: nextClientType,
    });

    setRecordData((prev) => ({
      ...prev,
      company: lockEntityType === "company" ? lockEntityId : undefined,
      employee:
        lockEntityType === "employee" || lockEntityType === "individual"
          ? lockEntityId
          : undefined,
      self: lockEntityType === "self" ? "zaad" : undefined,
    }));

    fetchBalance(lockEntityId, nextClientType);
  }, [
    fetchBalance,
    isLockedEntity,
    lockEntityType,
    lockEntityId,
    lockEntityName,
  ]);

  useEffect(() => {
    if (clientFee !== "") {
      const newServiceFee = parseFloat(clientFee) - recordData.amount;
      setRecordData((prevData) => ({ ...prevData, serviceFee: newServiceFee }));
    }
  }, [clientFee, recordData.amount]);

  const generateServiceFee = (e: any) => {
    const newClientFee = e.target.value;
    const newServiceFee = newClientFee - recordData.amount;
    setClientFee(newClientFee);
    setRecordData({ ...recordData, serviceFee: newServiceFee });
  };

  const fetchsearchSuggestions = async (inputValue: string) => {
    try {
      if (inputValue.length === 0) {
        setSearchSuggestions([]);
        return;
      }

      const [companiesRes, employeesRes, individualsRes] = await Promise.all([
        axios.get<TBaseData[]>(`/api/company/search/${inputValue}`),
        axios.get<TBaseData[]>(`/api/employee/search/${inputValue}`),
        axios.get<TBaseData[]>(`/api/individual/search/${inputValue}`),
      ]);

      const companies = (companiesRes.data || []).map((item) => ({
        ...item,
        entityType: "company" as const,
      }));
      const employees = (employeesRes.data || []).map((item) => ({
        ...item,
        entityType: "employee" as const,
      }));
      const individuals = (individualsRes.data || []).map((item) => ({
        ...item,
        entityType: "individual" as const,
      }));

      setSearchSuggestions([...companies, ...employees, ...individuals]);
    } catch (error) {
      console.error("Error fetching entity suggestions:", error);
      setSearchSuggestions([]);
    }
  };

  const debounceSearch = debounce((input: string) => {
    fetchsearchSuggestions(input);
  }, 300);

  const handleInputChange = (e: any) => {
    setSearchValue(e.target.value);
    setSelectedEntitySummary(null);
    setRecordData((prev) => ({
      ...prev,
      company: undefined,
      employee: undefined,
      self: undefined,
    }));
    debounceSearch(e.target.value);
  };

  const fetchPrev = useCallback(
    async (Id?: string) => {
      try {
        if (!edit) {
          const { data } = await axios.get<{ number: number; suffix: string }>(
            "/api/payment/prev",
          );
          setRecordData((prev) => ({
            ...prev,
            number: +data?.number + 1,
            suffix: data?.suffix,
          }));
        } else {
          const { data } = await axios.get(`/api/payment/${id}`);
          setRecordData(data);
          setSelectedMethod(data.method);
          setSelectedStatus(data.status);
          if (data.type === "expense") {
            setClientFee(data.amount + data.serviceFee);
          }
        }
      } catch (error) {
        console.error("Error fetching", error);
      }
    },
    [edit, id],
  );

  const handleEntitySelection = (
    selected: TBaseData & { entityType: "company" | "employee" | "individual" },
  ) => {
    if (!selected._id) {
      return;
    }
    const targetType = selected.entityType;
    setSearchValue(selected.name);
    setSelectedOption(targetType);
    setClientType(targetType);
    setSelectedEntitySummary({
      id: selected._id,
      name: selected.name,
      color: selected.color,
      type: targetType,
    });
    setRecordData((prev) => ({
      ...prev,
      company: targetType === "company" ? selected._id : undefined,
      employee:
        targetType === "employee" || targetType === "individual"
          ? selected._id
          : undefined,
      self: undefined,
    }));
    setSearchSuggestions([]);
    fetchBalance(selected._id, targetType);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    switch (true) {
      case !recordData.company && !recordData.employee && !recordData.self:
        toast.error("Please select a client from any type");
        return;
      case !recordData.particular:
        toast.error("Please fill in the particular.");
        return;
      case !recordData.method:
        toast.error("Please select a payment method.");
        return;
      case !recordData.number:
        toast.error("Please enter a transaction number.");
        return;
      default:
        break;
    }
    try {
      if (!edit) {
        if (recordData?.status === "Profit") {
          await axios.post("/api/payment/profit", recordData);
        } else {
          await axios.post("/api/payment", recordData);
        }
      } else {
        await axios.put(`/api/payment/${id}`, recordData);
      }
      const redirectPath = returnTo
        ? decodeURIComponent(returnTo)
        : "/accounts/transactions";
      router.push(redirectPath);
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to save transaction record";
      toast.error(message);
      console.log(error);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setRecordData({ ...recordData, [name]: value });
  };

  useEffect(() => {
    fetchPrev();
    void Promise.all([
      axios.get("/api/templates", { params: { type: "payment" } }),
      axios.get("/api/templates", { params: { type: "payment-status" } }),
    ])
      .then(([paymentRes, statusRes]) => {
        const methodOptions = (paymentRes.data?.options || []).map(
          (item: any) => ({
            value: item.method,
            label: item.label || item.method,
            color: item.color,
            icon: item.icon,
          }),
        );

        const statusOptions = (statusRes.data?.options || []).map(
          (item: any) => ({
            value: item.status,
            label: item.label || item.status,
            color: item.color,
            appliesTo: item.appliesTo || "both",
          }),
        );

        setPaymentMethodOptions(methodOptions);
        setPaymentStatusOptions(statusOptions);
      })
      .catch((error) => {
        console.error("Error fetching payment templates:", error);
      });
  }, [fetchPrev]);

  const inputClass =
    "w-full appearance-none rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900";
  const labelClass =
    "mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";

  const themeColor = type === "income" ? "emerald" : "rose";
  const themeBorder =
    type === "income"
      ? "border-emerald-500/50 hover:border-emerald-500 ring-emerald-500/20"
      : "border-rose-500/50 hover:border-rose-500 ring-rose-500/20";
  const buttonBg =
    type === "income"
      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30"
      : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/30";
  const selectedMethodMeta = paymentMethodOptions.find(
    (method) => method.value === selectedMethod,
  );
  const filteredStatusOptions = paymentStatusOptions.filter((statusOption) => {
    return statusOption.appliesTo === "both" || statusOption.appliesTo === type;
  });

  const applyOfficeExpensePreset = () => {
    setSelectedOption("self");
    setClientType("self");
    setSearchValue("ZAAD Self");
    setSelectedEntitySummary({ id: "self", name: "ZAAD Self", type: "self" });
    const officeStatus = filteredStatusOptions.find((item) =>
      item.value.toLowerCase().includes("office"),
    );
    const status = officeStatus?.value || "Office Expense";
    setSelectedStatus(status);
    setRecordData((prev) => ({
      ...prev,
      company: undefined,
      employee: undefined,
      self: "zaad",
      status,
    }));
  };

  const applyLiabilityPreset = () => {
    const liabilityStatus = filteredStatusOptions.find((item) =>
      item.value.toLowerCase().includes("liability"),
    );
    const status = liabilityStatus?.value || "liability";
    setSelectedStatus(status);
    setRecordData((prev) => ({
      ...prev,
      status,
    }));
  };

  return (
    <>
      <Breadcrumb
        pageName={(edit ? "Edit " : "Add ") + capitalize(recordData?.type)}
      />

      <form className="relative mx-auto max-w-5xl" action="#">
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none">
          <div
            className={clsx(
              "relative overflow-hidden border-b p-6 sm:p-7",
              type === "income"
                ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20"
                : "border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:border-rose-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20",
            )}
          >
            <div
              className={clsx(
                "pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl",
                type === "income" ? "bg-emerald-300/20" : "bg-rose-300/20",
              )}
            />
            <div
              className={clsx(
                "pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full blur-3xl",
                type === "income" ? "bg-teal-300/20" : "bg-orange-300/20",
              )}
            />

            <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider",
                    type === "income"
                      ? "border-emerald-300/60 bg-emerald-100/80 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "border-rose-300/60 bg-rose-100/80 text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/30 dark:text-rose-300",
                  )}
                >
                  {type === "income" ? <FiCheckCircle /> : <FiDollarSign />}
                  {type === "income" ? "Income Entry" : "Expense Entry"}
                </p>
                <h3 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {edit
                    ? "Edit Transaction Record"
                    : "Create Transaction Record"}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Capture client, method, amount, and status details with a
                  clean structured flow.
                </p>
              </div>

              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                <span
                  className={clsx(
                    "h-2.5 w-2.5 rounded-full",
                    type === "income" ? "bg-emerald-500" : "bg-rose-500",
                  )}
                />
                {edit ? "Update Mode" : "Create Mode"}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-7">
            <div className={clsx("rounded-2xl border p-5 sm:p-6", themeBorder)}>
              <div className="space-y-8">
                {!edit && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        Entity <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <FiUserPlus />
                          </span>
                          <input
                            type="text"
                            name="entity"
                            onChange={handleInputChange}
                            value={searchValue}
                            autoComplete="off"
                            disabled={isLockedEntity}
                            placeholder="Search company, employee, or individual..."
                            className={clsx(inputClass, "pl-11")}
                          />

                          {!isLockedEntity && searchSuggestions.length > 0 && (
                            <ul className="absolute z-30 mt-2 w-full max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                              {searchSuggestions.map((entity, key) => (
                                <li
                                  className="cursor-pointer px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-600 dark:text-slate-300 dark:hover:bg-slate-700"
                                  key={key}
                                  onClick={() => handleEntitySelection(entity)}
                                >
                                  <div className="flex items-center gap-3">
                                    <EntityAvatar
                                      name={entity.name}
                                      color={entity.color}
                                      size="sm"
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {entity.name}
                                      </span>
                                      <span className="text-[10px] uppercase tracking-wider text-slate-400">
                                        {entity.entityType}
                                      </span>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {type === "expense" && (
                          <button
                            type="button"
                            onClick={applyOfficeExpensePreset}
                            className="rounded-xl border border-fuchsia-300 bg-fuchsia-50 px-4 py-2.5 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-100 dark:border-fuchsia-800 dark:bg-fuchsia-900/20 dark:text-fuchsia-300"
                          >
                            Office Expense
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={applyLiabilityPreset}
                          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                        >
                          Liability
                        </button>
                      </div>
                    </div>

                    {isLockedEntity && (
                      <div>
                        <label className={labelClass}>Locked Entity</label>
                        <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {lockEntityName || lockEntityId} (
                          {capitalize(lockEntityType)})
                        </div>
                      </div>
                    )}

                    {selectedEntitySummary && (
                      <div>
                        <label className={labelClass}>Selected Entity</label>
                        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-900/10">
                          <EntityAvatar
                            name={selectedEntitySummary.name}
                            color={selectedEntitySummary.color}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {selectedEntitySummary.name}
                            </p>
                            <p className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                              {selectedEntitySummary.type}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className={labelClass}>Particular / Purpose</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <FiFileText />
                    </span>
                    <input
                      type="text"
                      name="particular"
                      required={true}
                      value={recordData?.particular}
                      onChange={handleChange}
                      placeholder="E.g., Salary payment, Consultation fee..."
                      className={clsx(inputClass, "pl-11")}
                    />
                  </div>
                </div>

                {/* Transaction Context Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>Transaction Suffix</label>
                    <input
                      type="text"
                      name="suffix"
                      value={recordData?.suffix}
                      onChange={handleChange}
                      placeholder="e.g. TRN-"
                      className={clsx(inputClass, "uppercase")}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Transaction Number</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <FiHash />
                      </span>
                      <input
                        type="number"
                        name="number"
                        onWheel={(e: any) => e.target.blur()}
                        value={recordData?.number}
                        onChange={handleChange}
                        placeholder="000"
                        className={clsx(inputClass, "pl-11")}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Invoice Number</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <FiHash />
                      </span>
                      <input
                        type="text"
                        name="invoiceNo"
                        value={recordData?.invoiceNo}
                        onChange={handleChange}
                        placeholder="INV-..."
                        className={clsx(inputClass, "pl-11")}
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>
                      Payment Method <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative z-20">
                      <select
                        value={selectedMethod}
                        name="method"
                        title="method"
                        onChange={(e) => {
                          setSelectedMethod(e.target.value);
                          setRecordData({
                            ...recordData,
                            method: e.target.value,
                          });
                        }}
                        className={inputClass}
                      >
                        <option value="" disabled>
                          Select Method
                        </option>
                        {paymentMethodOptions.map((method) => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <FiChevronDown />
                      </span>
                    </div>
                    {selectedMethod && (
                      <div className="mt-2">
                        <PaymentMethodBadge
                          label={selectedMethodMeta?.label || selectedMethod}
                          color={selectedMethodMeta?.color}
                          icon={selectedMethodMeta?.icon}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Amount (AED)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <FiDollarSign />
                      </span>
                      <input
                        type="number"
                        name="amount"
                        value={recordData?.amount}
                        onWheel={(e: any) => e.target.blur()}
                        onChange={handleChange}
                        placeholder="0.00"
                        className={clsx(inputClass, "pl-11 font-semibold")}
                      />
                    </div>
                  </div>

                  {type === "expense" && (
                    <div>
                      <label className={labelClass}>
                        Client Fee
                        <span
                          className={clsx(
                            "ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                            balance >= 0
                              ? "bg-emerald-50 text-emerald-600 ring-emerald-500/20"
                              : "bg-rose-50 text-rose-600 ring-rose-500/20",
                          )}
                        >
                          Bal: {balance?.toFixed(2)}
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <FiDollarSign />
                        </span>
                        <input
                          type="number"
                          name="clientFee"
                          value={clientFee}
                          onWheel={(e: any) => e.target.blur()}
                          placeholder="0.00"
                          onChange={generateServiceFee}
                          className={clsx(inputClass, "pl-11")}
                        />
                      </div>
                    </div>
                  )}

                  <div
                    className={
                      type === "expense" ? "md:col-span-2 lg:col-span-3" : ""
                    }
                  >
                    <label className={labelClass}>
                      Payment Status <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative z-20">
                      <select
                        title="payment status"
                        value={selectedStatus}
                        name="payment-status"
                        onChange={(e) => {
                          setSelectedStatus(e.target.value);
                          setRecordData({
                            ...recordData,
                            status: e.target.value,
                          });
                        }}
                        className={inputClass}
                      >
                        <option value="" disabled>
                          Select Status
                        </option>
                        {filteredStatusOptions.length > 0 ? (
                          filteredStatusOptions.map((statusOption) => (
                            <option
                              key={statusOption.value}
                              value={statusOption.value}
                            >
                              {statusOption.label}
                            </option>
                          ))
                        ) : (
                          <>
                            {type === "income" && (
                              <>
                                <option value="Advance">Advance</option>
                                <option value="Credit">Credit (Income)</option>
                                <option value="Ready Cash">Ready Cash</option>
                                <option value="liability">
                                  Liability Payment
                                </option>
                                <option value="Profit">Instant Profit</option>
                              </>
                            )}
                            {type === "expense" && (
                              <>
                                <option value="Debit">Debit (Pay Out)</option>
                                <option value="liability">
                                  Liability Payment
                                </option>
                                <option value="Office Expense">
                                  Office Expense
                                </option>
                              </>
                            )}
                          </>
                        )}
                      </select>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <FiChevronDown />
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Remarks</label>
                  <textarea
                    rows={4}
                    name="remarks"
                    placeholder="Optional details or notes regarding this transaction..."
                    value={recordData?.remarks}
                    onChange={handleChange}
                    className={clsx(inputClass, "resize-y")}
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleSubmit}
                    className={clsx(
                      buttonBg,
                      "flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
                      type === "income"
                        ? "focus:ring-emerald-500"
                        : "focus:ring-rose-500",
                    )}
                  >
                    {type === "income" ? (
                      <FiCheckCircle className="text-xl" />
                    ) : (
                      <FiDollarSign className="text-xl" />
                    )}
                    {edit
                      ? "Save Changes"
                      : `Add ${capitalize(recordData?.type)}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default AddRecord;
