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
  FiPlus,
  FiUserPlus,
  FiCircle,
} from "react-icons/fi";
import EntityAvatar from "../common/EntityAvatar";
import PaymentMethodBadge from "../common/PaymentMethodBadge";

type TEntitySearchType = "company" | "employee" | "individual";

type AddRecordProps = {
  type: string;
  edit?: boolean;
  suggestionCategory?:
    | "office_records"
    | "company_expense"
    | "liability_in"
    | "liability_out"
    | "instant_profit"
    | "income"
    | "expense";
  submitEndpoint?: "/api/payment" | "/api/payment/profit";
  hideBreadcrumb?: boolean;
  hidePaymentStatus?: boolean;
  showSpecialModes?: boolean;
  forceRecordKind?: "standard" | "company" | "liability" | "instant_profit";
  initialMode?: "normal" | "liability" | "instant-profit";
};

const AddRecord = ({
  type,
  edit,
  suggestionCategory = "office_records",
  submitEndpoint,
  hideBreadcrumb = false,
  hidePaymentStatus = false,
  showSpecialModes = false,
  forceRecordKind,
  initialMode = "normal",
}: AddRecordProps) => {
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
  const [searchEntityType, setSearchEntityType] =
    useState<TEntitySearchType | "">("");
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
  const [recordMode, setRecordMode] = useState<
    "normal" | "liability" | "instant-profit"
  >(initialMode);
  const [particularSuggestions, setParticularSuggestions] = useState<string[]>([]);
  const [showParticularSuggestions, setShowParticularSuggestions] = useState(false);
  const [isSavingParticularSuggestion, setIsSavingParticularSuggestion] = useState(false);
  const [recordData, setRecordData] = useState<TRecordData>({
    createdBy: user?._id,
    type,
    amount: 0,
    particular: "",
    paymentMethodTemplate: "",
    paymentStatusTemplate: "",
    recordKind: forceRecordKind || "standard",
    remarks: "",
    number: 0,
    suffix: "",
  });

  const resolveRecordKind = (nextKind: TRecordData["recordKind"] | undefined) =>
    forceRecordKind || nextKind || "standard";

  useEffect(() => {
    if (!selectedOption) {
      setRecordData((prev) => ({ ...prev, entity: undefined }));
    }
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
        : lockEntityType;
    setSelectedOption(nextClientType);
    if (
      lockEntityType === "company" ||
      lockEntityType === "employee" ||
      lockEntityType === "individual"
    ) {
      setSearchEntityType(lockEntityType);
    }
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
      entity:
        lockEntityType === "company" ||
        lockEntityType === "employee" ||
        lockEntityType === "individual"
          ? lockEntityId
          : undefined,
      recordKind: resolveRecordKind(lockEntityType === "company" ? "company" : "standard"),
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

  const fetchsearchSuggestions = async (
    inputValue: string,
    entityType: TEntitySearchType | "",
  ) => {
    try {
      if (inputValue.length === 0 || !entityType) {
        setSearchSuggestions([]);
        return;
      }

      const response = await axios.get<TBaseData[]>(
        `/api/${entityType}/search/${inputValue}`,
      );

      const scopedResults = (response.data || []).map((item) => ({
        ...item,
        entityType,
      }));

      setSearchSuggestions(scopedResults);
    } catch (error) {
      console.error("Error fetching entity suggestions:", error);
      setSearchSuggestions([]);
    }
  };

  const debounceSearch = debounce(
    (input: string, entityType: TEntitySearchType | "") => {
      fetchsearchSuggestions(input, entityType);
    },
    300,
  );

  const handleEntityTypeChange = (entityType: TEntitySearchType | "") => {
    if (isLockedEntity) return;

    setSearchEntityType(entityType);
    setSelectedOption(entityType);
    setClientType(entityType);
    setSearchValue("");
    setSearchSuggestions([]);
    setSelectedEntitySummary(null);
    setBalance(0);
    setRecordData((prev) => ({
      ...prev,
      entity: undefined,
      recordKind: resolveRecordKind(entityType === "company" ? "company" : "standard"),
    }));
  };

  const handleInputChange = (e: any) => {
    const nextSearch = e.target.value;
    setSearchValue(nextSearch);

    if (!searchEntityType) {
      setSearchSuggestions([]);
      return;
    }

    setSelectedEntitySummary(null);
    setRecordData((prev) => ({
      ...prev,
      entity: undefined,
      recordKind: resolveRecordKind(searchEntityType === "company" ? "company" : "standard"),
    }));
    debounceSearch(nextSearch, searchEntityType);
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
          const resolvedEntityType =
            data?.entity?.entityType ||
            (data?.recordKind === "company" ? "company" : undefined);
          const resolvedEntity = data?.entity?._id || data?.entity || undefined;

          setRecordData({
            ...data,
            entity: resolvedEntity,
            paymentMethodTemplate:
              data?.paymentMethodTemplate?._id || data?.paymentMethodTemplate || "",
            paymentStatusTemplate:
              data?.paymentStatusTemplate?._id || data?.paymentStatusTemplate || "",
          });

          if (resolvedEntityType) {
            setSelectedOption(resolvedEntityType);
          }
          setSelectedMethod(data?.paymentMethodTemplate?._id || data?.paymentMethodTemplate || "");
          setSelectedStatus(data?.paymentStatusTemplate?._id || data?.paymentStatusTemplate || "");
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
      entity: selected._id,
      recordKind: resolveRecordKind(targetType === "company" ? "company" : "standard"),
    }));
    setSearchSuggestions([]);
    fetchBalance(selected._id, targetType);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    switch (true) {
      case !recordData.entity:
        toast.error("Please select a client from any type");
        return;
      case !recordData.particular:
        toast.error("Please fill in the particular.");
        return;
      case !recordData.paymentMethodTemplate:
        toast.error("Please select a payment method.");
        return;
        case !hidePaymentStatus && !recordData.paymentStatusTemplate:
        toast.error("Please select a payment status.");
        return;
      case !recordData.number:
        toast.error("Please enter a transaction number.");
        return;
      default:
        break;
    }
    try {
      if (!edit) {
        if (submitEndpoint === "/api/payment/profit" || recordData?.recordKind === "instant_profit") {
          await axios.post("/api/payment/profit", recordData);
        } else {
          await axios.post(submitEndpoint || "/api/payment", recordData);
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
            value: item.id,
            label: item.label || item.method,
            color: item.color,
            icon: item.icon,
          }),
        );

        const statusOptions = (statusRes.data?.options || []).map(
          (item: any) => ({
            value: item.id,
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

  useEffect(() => {
    const query = recordData?.particular?.trim();
    if (!query || query.length < 2) {
      setParticularSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        q: query,
        type,
        category: suggestionCategory,
      });

      axios
        .get(`/api/payment/particular-suggestions?${params.toString()}`)
        .then((response) => {
          setParticularSuggestions(Array.isArray(response.data?.suggestions) ? response.data.suggestions : []);
        })
        .catch((error) => {
          console.error("Error fetching particular suggestions:", error);
          setParticularSuggestions([]);
        });
    }, 220);

    return () => clearTimeout(timer);
  }, [recordData?.particular, suggestionCategory, type]);

  const saveParticularSuggestion = async () => {
    const particular = recordData?.particular?.trim();
    if (!particular) {
      toast.error("Type a particular first");
      return;
    }

    try {
      setIsSavingParticularSuggestion(true);
      await axios.post("/api/payment/particular-suggestions", {
        particular,
        category: suggestionCategory,
      });
      toast.success("Particular suggestion saved");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to save particular suggestion");
    } finally {
      setIsSavingParticularSuggestion(false);
    }
  };

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
    const statusLabel = String(statusOption.label || "").toLowerCase();
    const isSpecialStatus = statusLabel.includes("liability") || statusLabel.includes("profit");
    if (!showSpecialModes && isSpecialStatus) {
      return false;
    }

    return statusOption.appliesTo === "both" || statusOption.appliesTo === type;
  });

  const applyLiabilityPreset = () => {
    const liabilityStatus = filteredStatusOptions.find((item) =>
      item.label.toLowerCase().includes("liability"),
    );
    const status = liabilityStatus?.value || "";
    setSelectedStatus(status);
    setRecordMode("liability");
    setRecordData((prev) => ({
      ...prev,
      paymentStatusTemplate: status,
      recordKind: resolveRecordKind("liability"),
    }));
  };

  const applyInstantProfitPreset = () => {
    const profitStatus = filteredStatusOptions.find((item) =>
      item.label.toLowerCase().includes("profit"),
    );
    const status = profitStatus?.value || "";
    setSelectedStatus(status);
    setRecordMode("instant-profit");
    setRecordData((prev) => ({
      ...prev,
      paymentStatusTemplate: status,
      recordKind: resolveRecordKind("instant_profit"),
    }));
  };

  const handleModeChange = (mode: "normal" | "liability" | "instant-profit") => {
    setRecordMode(mode);

    if (mode === "liability") {
      applyLiabilityPreset();
      return;
    }

    if (mode === "instant-profit") {
      applyInstantProfitPreset();
      return;
    }

    setRecordData((prev) => ({
      ...prev,
      recordKind: resolveRecordKind(selectedOption === "company" ? "company" : "standard"),
    }));
  };

  const selectedStatusMeta = filteredStatusOptions.find(
    (statusOption) => statusOption.value === selectedStatus,
  );
  const activeRecordKind = String(recordData?.recordKind || forceRecordKind || "standard").toLowerCase();
  const isCompanyRecord = activeRecordKind === "company";
  const isLiabilityRecord = activeRecordKind === "liability";
  const isInstantProfitRecord = activeRecordKind === "instant_profit";
  const headerTone = isCompanyRecord
    ? "cyan"
    : isLiabilityRecord
      ? "orange"
      : isInstantProfitRecord
        ? "violet"
        : type === "income"
          ? "emerald"
          : "rose";
  const headerCopy = isCompanyRecord
    ? {
        badge: "Company Entry",
        title: "Create Company Transaction Record",
        description: "Capture company-specific transactions with a dedicated flow.",
      }
    : isLiabilityRecord
      ? {
          badge: "Liability Entry",
          title: "Create Liability Transaction Record",
          description: "Capture liability transactions with a dedicated flow.",
        }
      : isInstantProfitRecord
        ? {
            badge: "Special Entry",
            title: "Create Instant Profit Record",
            description: "Capture instant profit transactions with a dedicated flow.",
          }
        : {
            badge: type === "income" ? "Income Entry" : "Expense Entry",
            title: edit ? "Edit Transaction Record" : "Create Transaction Record",
            description: "Capture client, method, amount, and status details with a clean structured flow.",
          };

  const headerClasses = {
    emerald: {
      shell:
        "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20",
      glowA: "bg-emerald-300/20",
      glowB: "bg-teal-300/20",
      badge: "border-emerald-300/60 bg-emerald-100/80 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-300",
      accent: "bg-emerald-500",
    },
    rose: {
      shell:
        "border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:border-rose-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20",
      glowA: "bg-rose-300/20",
      glowB: "bg-orange-300/20",
      badge: "border-rose-300/60 bg-rose-100/80 text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/30 dark:text-rose-300",
      accent: "bg-rose-500",
    },
    orange: {
      shell:
        "border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:border-orange-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/20",
      glowA: "bg-orange-300/20",
      glowB: "bg-amber-300/20",
      badge: "border-orange-300/60 bg-orange-100/80 text-orange-700 dark:border-orange-700/40 dark:bg-orange-900/30 dark:text-orange-300",
      accent: "bg-orange-500",
    },
    cyan: {
      shell:
        "border-cyan-200/80 bg-gradient-to-br from-cyan-50 via-white to-blue-50 dark:border-cyan-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20",
      glowA: "bg-cyan-300/20",
      glowB: "bg-blue-300/20",
      badge: "border-cyan-300/60 bg-cyan-100/80 text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300",
      accent: "bg-cyan-500",
    },
    violet: {
      shell:
        "border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:border-violet-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20",
      glowA: "bg-violet-300/20",
      glowB: "bg-fuchsia-300/20",
      badge: "border-violet-300/60 bg-violet-100/80 text-violet-700 dark:border-violet-700/40 dark:bg-violet-900/30 dark:text-violet-300",
      accent: "bg-violet-500",
    },
  } as const;

  return (
    <>
      {hideBreadcrumb ? null : (
        <Breadcrumb pageName={(edit ? "Edit " : "Add ") + capitalize(recordData?.type)} />
      )}

      <form className="relative mx-auto max-w-5xl" action="#">
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none">
          <div
            className={clsx(
              "relative overflow-hidden border-b p-6 sm:p-7",
              headerClasses[headerTone].shell,
            )}
          >
            <div
              className={clsx(
                "pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl",
                headerClasses[headerTone].glowA,
              )}
            />
            <div
              className={clsx(
                "pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full blur-3xl",
                headerClasses[headerTone].glowB,
              )}
            />

            <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider",
                    headerClasses[headerTone].badge,
                  )}
                >
                  {isCompanyRecord ? <FiDollarSign /> : isLiabilityRecord ? <FiDollarSign /> : type === "income" ? <FiCheckCircle /> : <FiDollarSign />}
                  {headerCopy.badge}
                </p>
                <h3 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {headerCopy.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {headerCopy.description}
                </p>
              </div>

              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                <span
                  className={clsx(
                    "h-2.5 w-2.5 rounded-full",
                    headerClasses[headerTone].accent,
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
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                        <div className="relative z-20">
                          <select
                            title="entity type"
                            value={searchEntityType}
                            onChange={(e) =>
                              handleEntityTypeChange(
                                e.target.value as TEntitySearchType | "",
                              )
                            }
                            disabled={isLockedEntity}
                            className={inputClass}
                          >
                            <option value="" disabled>
                              Select entity type
                            </option>
                            <option value="company">Company</option>
                            <option value="employee">Employee</option>
                            <option value="individual">Individual</option>
                          </select>
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <FiChevronDown />
                          </span>
                        </div>

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
                            disabled={isLockedEntity || !searchEntityType}
                            placeholder={
                              searchEntityType
                                ? `Search ${searchEntityType}...`
                                : "Select entity type first"
                            }
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
                      onChange={(e) => {
                        handleChange(e);
                        setShowParticularSuggestions(true);
                      }}
                      onFocus={() => setShowParticularSuggestions(true)}
                      placeholder="E.g., Salary payment, Consultation fee..."
                      className={clsx(inputClass, "pl-11")}
                    />

                    {showParticularSuggestions && particularSuggestions.length > 0 && (
                      <div className="absolute z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                        <div className="max-h-44 overflow-y-auto">
                          {particularSuggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => {
                                setRecordData((prev) => ({ ...prev, particular: suggestion }));
                                setShowParticularSuggestions(false);
                              }}
                              className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Start typing to see suggestions from previous records and saved templates.
                    </p>
                    <button
                      type="button"
                      onClick={saveParticularSuggestion}
                      disabled={isSavingParticularSuggestion}
                      className="inline-flex items-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 disabled:opacity-60 dark:border-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300"
                    >
                      <FiPlus />
                      {isSavingParticularSuggestion ? "Saving..." : "Save as Suggestion"}
                    </button>
                  </div>
                </div>

                {/* Transaction Context Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        name="paymentMethodTemplate"
                        title="method"
                        onChange={(e) => {
                          setSelectedMethod(e.target.value);
                          setRecordData({
                            ...recordData,
                            paymentMethodTemplate: e.target.value,
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
                    {showSpecialModes ? (
                      <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Record Mode
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <label className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                            <input
                              type="radio"
                              name="recordMode"
                              value="normal"
                              checked={recordMode === "normal"}
                              onChange={() => handleModeChange("normal")}
                              className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            Normal
                          </label>
                          <label className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                            <input
                              type="radio"
                              name="recordMode"
                              value="liability"
                              checked={recordMode === "liability"}
                              onChange={() => handleModeChange("liability")}
                              className="h-4 w-4 border-slate-300 text-amber-600 focus:ring-amber-500"
                            />
                            Make as Liability
                          </label>
                          {type === "income" && (
                            <label className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                              <input
                                type="radio"
                                name="recordMode"
                                value="instant-profit"
                                checked={recordMode === "instant-profit"}
                                onChange={() => handleModeChange("instant-profit")}
                                className="h-4 w-4 border-slate-300 text-violet-600 focus:ring-violet-500"
                              />
                              Make as Instant Profit
                            </label>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {!hidePaymentStatus && (
                      <>
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
                              const selectedTemplate = filteredStatusOptions.find(
                                (item) => item.value === e.target.value,
                              );
                              const normalized = String(selectedTemplate?.label || "").toLowerCase();
                              if (normalized.includes("liability")) {
                                setRecordMode("liability");
                              } else if (normalized.includes("profit")) {
                                setRecordMode("instant-profit");
                              } else {
                                setRecordMode("normal");
                              }
                              setRecordData({
                                ...recordData,
                                paymentStatusTemplate: e.target.value,
                                recordKind: resolveRecordKind(
                                  normalized.includes("liability")
                                    ? "liability"
                                    : normalized.includes("profit")
                                      ? "instant_profit"
                                      : selectedOption === "company"
                                        ? "company"
                                        : "standard",
                                ),
                              });
                            }}
                            className={inputClass}
                          >
                            <option value="" disabled>
                              Select Status
                            </option>
                            {filteredStatusOptions.length > 0 ? (
                              filteredStatusOptions.map((statusOption) => (
                                <option key={statusOption.value} value={statusOption.value}>
                                  {statusOption.label}
                                </option>
                              ))
                            ) : showSpecialModes ? (
                              <>
                                {type === "income" && (
                                  <>
                                    <option value="Advance">Advance</option>
                                    <option value="Credit">Credit (Income)</option>
                                    <option value="Ready Cash">Ready Cash</option>
                                    <option value="liability">Liability Payment</option>
                                    <option value="Profit">Instant Profit</option>
                                  </>
                                )}
                                {type === "expense" && (
                                  <>
                                    <option value="Debit">Debit (Pay Out)</option>
                                    <option value="liability">Liability Payment</option>
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                {type === "income" && (
                                  <>
                                    <option value="Advance">Advance</option>
                                    <option value="Credit">Credit (Income)</option>
                                    <option value="Ready Cash">Ready Cash</option>
                                  </>
                                )}
                                {type === "expense" && <option value="Debit">Debit (Pay Out)</option>}
                              </>
                            )}
                          </select>
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <FiChevronDown />
                          </span>
                        </div>
                        {selectedStatusMeta && (
                          <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                            <span
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white"
                              style={{
                                backgroundColor:
                                  selectedStatusMeta.color || "#0F766E",
                              }}
                            >
                              <FiCircle className="text-[10px]" />
                            </span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                              {selectedStatusMeta.label}
                            </span>
                          </div>
                        )}
                      </>
                    )}
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
