"use client";
import { useUserContext } from "@/contexts/UserContext";
import { TRecordData } from "@/types/records";
import { getPaymentMethodIcon } from "@/config/paymentMethodIcons";
import { TPaymentTemplateIcon } from "@/config/templateVisuals";
import axios from "axios";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import {
  FiSave,
  FiLoader,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiCreditCard,
  FiTrendingUp,
  FiShield,
  FiHome,
  FiSearch,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiEdit2,
  FiX,
  FiTrendingDown,
} from "react-icons/fi";
import { debounce } from "lodash";

type RecordType = "income" | "expense";
type RecordKind =
  | "standard"
  | "office_records"
  | "liability"
  | "instant_profit"
  | "self_transfer";

interface PaymentMethod {
  id: string;
  label: string;
  method?: string;
  color?: string;
  icon?: string;
}

interface PaymentStatus {
  id: string;
  label: string;
  status?: string;
  appliesTo?: "income" | "expense" | "both";
  color?: string;
}

interface OfficeExpenseCategoryOption {
  id: string;
  label: string;
  category?: string;
  color?: string;
  icon?: TPaymentTemplateIcon;
}

interface EntityOption {
  _id: string;
  name: string;
  color?: string;
  entityType: "company" | "employee" | "individual";
}

interface PreviousPaymentSequence {
  suffix?: string;
  number?: number;
}

interface EntityDetailResponse {
  data?: {
    id?: string;
    name?: string;
    color?: string;
  };
}

interface SimpleRecordFormProps {
  recordId?: string;
  isEdit?: boolean;
}

interface RecordKindTile {
  kind: RecordKind;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const recordKindTiles: RecordKindTile[] = [
  {
    kind: "standard",
    label: "Standard",
    description: "Regular billing",
    icon: <FiClock className="h-5 w-5" />,
    color: "#2563eb",
  },
  {
    kind: "office_records",
    label: "Office",
    description: "Internal overhead",
    icon: <FiHome className="h-5 w-5" />,
    color: "#d97706",
  },
  {
    kind: "liability",
    label: "Liability",
    description: "Debt tracking",
    icon: <FiShield className="h-5 w-5" />,
    color: "#dc2626",
  },
  {
    kind: "instant_profit",
    label: "Instant Profit",
    description: "Instant profit",
    icon: <FiTrendingUp className="h-5 w-5" />,
    color: "#7c3aed",
  },
  {
    kind: "self_transfer",
    label: "Transfer",
    description: "Internal move",
    icon: <FiRefreshCw className="h-5 w-5" />,
    color: "#0891b2",
  },
];

const SimpleRecordForm = ({
  recordId,
  isEdit = false,
}: SimpleRecordFormProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserContext();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);
  const [officeExpenseCategories, setOfficeExpenseCategories] = useState<
    OfficeExpenseCategoryOption[]
  >([]);
  const [entitySearchResults, setEntitySearchResults] = useState<
    EntityOption[]
  >([]);
  const [entitySearchLoading, setEntitySearchLoading] = useState(false);
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);
  const [particularSuggestions, setParticularSuggestions] = useState<string[]>(
    [],
  );
  const [particularLoading, setParticularLoading] = useState(false);
  const [showParticularDropdown, setShowParticularDropdown] = useState(false);
  const [isEditingTransactionNumber, setIsEditingTransactionNumber] =
    useState(false);
  const [clientFee, setClientFee] = useState<number | "">("");

  const [formData, setFormData] = useState<
    Partial<TRecordData> & { from?: string; to?: string }
  >({
    type: "income",
    amount: undefined,
    particular: "",
    category: "",
    recordKind: "standard",
    remarks: "",
    serviceFee: 0,
    method: "",
    suffix: "",
    number: 0,
    transferGroupId: "",
    createdBy: user?._id,
  });

  const [entitySearch, setEntitySearch] = useState<string>("");
  const [selectedEntity, setSelectedEntity] = useState<EntityOption | null>(
    null,
  );
  const createdById = user?._id;

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await axios.get("/api/templates");
      setPaymentMethods(res.data?.paymentOptions || []);
      setPaymentStatuses(res.data?.paymentStatusOptions || []);
      setOfficeExpenseCategories(res.data?.officeExpenseCategoryOptions || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  }, []);

  const fetchPreviousSequence = useCallback(async () => {
    try {
      const res = await axios.get<PreviousPaymentSequence>("/api/payment/prev");
      const suffix = String(res.data?.suffix || "");
      const number = Number(res.data?.number || 0);

      setFormData((prev) => ({
        ...prev,
        suffix,
        number,
      }));
    } catch (error) {
      console.error("Error fetching previous payment sequence:", error);
    }
  }, []);

  const fetchEntityDetailsById = useCallback(async (entityId: string) => {
    const id = String(entityId || "").trim();
    if (!id) return null;

    const sources: Array<{
      type: EntityOption["entityType"];
      url: string;
    }> = [
        { type: "company", url: `/api/company/${id}` },
        { type: "employee", url: `/api/employee/${id}` },
        { type: "individual", url: `/api/individual/${id}` },
      ];

    for (const source of sources) {
      try {
        const res = await axios.get<EntityDetailResponse>(source.url);
        const entityData = res.data?.data;
        if (!entityData?.id || !entityData?.name) continue;

        return {
          _id: String(entityData.id),
          name: String(entityData.name),
          color: entityData.color,
          entityType: source.type,
        } as EntityOption;
      } catch {
        // Try next entity source when ID doesn't match this type.
      }
    }

    return null;
  }, []);

  const loadExistingRecord = useCallback(async () => {
    try {
      const res = await axios.get(`/api/payment/${recordId}`);
      const data = res.data;
      const normalizedAmount = Number(data?.amount || 0);
      const normalizedServiceFee = Number(data?.serviceFee || 0);
      const normalizedType = String(data?.type || "").toLowerCase();
      const normalizedRecordKind = String(data?.recordKind || "").toLowerCase();
      const supportsClientFee =
        normalizedType === "expense" &&
        ["standard", "instant_profit"].includes(normalizedRecordKind);

      setFormData({
        ...data,
        amount: normalizedAmount,
        serviceFee: normalizedServiceFee,
        method:
          data?.method?._id ||
          data?.method ||
          data?.paymentMethodTemplate?._id ||
          data?.paymentMethodTemplate ||
          "",
        status:
          data?.status?._id ||
          data?.status ||
          data?.paymentStatusTemplate?._id ||
          data?.paymentStatusTemplate ||
          "",
        category: data?.category?._id || data?.category || "",
        entity: data?.entity?._id || data?.entity || undefined,
      });

      if (supportsClientFee) {
        setClientFee(
          Number((normalizedAmount + normalizedServiceFee).toFixed(2)),
        );
      } else {
        setClientFee("");
      }
      if (
        data?.entity?._id ||
        data?.entity?.name ||
        typeof data?.entity === "string"
      ) {
        const fallbackEntity: EntityOption = {
          _id: data?.entity?._id || data?.entity || "",
          name: data?.entity?.name || "Current entity",
          color: data?.entity?.color,
          entityType: data?.entity?.entityType || "company",
        };

        setSelectedEntity(fallbackEntity);
        setEntitySearch(data?.entity?.name || "Current entity");

        const entityId = data?.entity?._id || data?.entity;
        const shouldFetchEntityDetails =
          typeof entityId === "string" &&
          (!data?.entity?.name || !data?.entity?.entityType);

        if (shouldFetchEntityDetails) {
          const detailedEntity = await fetchEntityDetailsById(entityId);
          if (detailedEntity) {
            setSelectedEntity(detailedEntity);
            setEntitySearch(detailedEntity.name);
          }
        }
      }
    } catch (error) {
      console.error("Error loading record:", error);
      toast.error("Failed to load record");
    }
  }, [recordId, fetchEntityDetailsById]);

  useEffect(() => {
    fetchTemplates();
    if (isEdit && recordId) {
      loadExistingRecord();
      return;
    }
    fetchPreviousSequence();
  }, [
    recordId,
    isEdit,
    loadExistingRecord,
    fetchTemplates,
    fetchPreviousSequence,
  ]);

  useEffect(() => {
    if (isEdit) return;

    const lockedEntityId = String(searchParams.get("lockEntityId") || "").trim();
    if (!lockedEntityId) return;

    const lockedEntityTypeRaw = String(searchParams.get("lockEntityType") || "")
      .trim()
      .toLowerCase();
    const lockedEntityName = String(searchParams.get("lockEntityName") || "").trim();

    const normalizedEntityType: EntityOption["entityType"] =
      lockedEntityTypeRaw === "employee" || lockedEntityTypeRaw === "individual"
        ? lockedEntityTypeRaw
        : "company";

    const applyLockedEntity = async () => {
      let nextEntity: EntityOption | null = null;

      if (lockedEntityName) {
        nextEntity = {
          _id: lockedEntityId,
          name: lockedEntityName,
          entityType: normalizedEntityType,
        };
      } else {
        nextEntity = await fetchEntityDetailsById(lockedEntityId);
      }

      if (!nextEntity) {
        nextEntity = {
          _id: lockedEntityId,
          name: lockedEntityName || "Selected entity",
          entityType: normalizedEntityType,
        };
      }

      setSelectedEntity(nextEntity);
      setEntitySearch(nextEntity.name);
      setShowEntityDropdown(false);
      setFormData((prev) => ({
        ...prev,
        entity: nextEntity?._id,
      }));
    };

    void applyLockedEntity();
  }, [fetchEntityDetailsById, isEdit, searchParams]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const updateDarkMode = () => {
      setIsDarkMode(document.body.classList.contains("dark"));
    };

    updateDarkMode();

    const observer = new MutationObserver(updateDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const performEntitySearch = useCallback(async (searchValue: string) => {
    if (!searchValue.trim()) {
      setEntitySearchResults([]);
      return;
    }

    setEntitySearchLoading(true);
    try {
      const [companies, employees, individuals] = await Promise.all([
        axios.get<EntityOption[]>(`/api/company/search/${searchValue}`),
        axios.get<EntityOption[]>(`/api/employee/search/${searchValue}`),
        axios.get<EntityOption[]>(`/api/individual/search/${searchValue}`),
      ]);

      const results: EntityOption[] = [
        ...(companies.data || []).map((item) => ({
          ...item,
          entityType: "company" as const,
        })),
        ...(employees.data || []).map((item) => ({
          ...item,
          entityType: "employee" as const,
        })),
        ...(individuals.data || []).map((item) => ({
          ...item,
          entityType: "individual" as const,
        })),
      ];

      setEntitySearchResults(results);
    } catch (error) {
      console.error("Error searching entities:", error);
    } finally {
      setEntitySearchLoading(false);
    }
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce((searchValue: string) => performEntitySearch(searchValue), 300),
    [performEntitySearch],
  );

  const getParticularCategory = useCallback(() => {
    const effectiveRecordKind =
      isEdit && formData.recordKind === "instant_profit"
        ? "standard"
        : formData.recordKind;

    if (effectiveRecordKind === "office_records") return "office_records";
    if (effectiveRecordKind === "liability")
      return formData.type === "income" ? "liability_in" : "liability_out";
    if (effectiveRecordKind === "instant_profit") return "instant_profit";
    return formData.type === "income" ? "income" : "expense";
  }, [formData.recordKind, formData.type, isEdit]);

  const performParticularSearch = useCallback(
    async (searchValue: string) => {
      if (!searchValue.trim()) {
        setParticularSuggestions([]);
        return;
      }

      setParticularLoading(true);
      try {
        const category = getParticularCategory();
        const res = await axios.get("/api/payment/particular-suggestions", {
          params: { q: searchValue, category },
        });
        setParticularSuggestions(res.data?.suggestions || []);
      } catch (error) {
        console.error("Error searching particular suggestions:", error);
        setParticularSuggestions([]);
      } finally {
        setParticularLoading(false);
      }
    },
    [getParticularCategory],
  );

  const debouncedParticularSearch = useMemo(
    () =>
      debounce(
        (searchValue: string) => performParticularSearch(searchValue),
        300,
      ),
    [performParticularSearch],
  );

  const handleEntitySearch = (value: string) => {
    setEntitySearch(value);
    setShowEntityDropdown(true);
    debouncedSearch(value);
  };

  const handleParticularSearch = (value: string) => {
    setFormData((prev) => ({ ...prev, particular: value }));
    setShowParticularDropdown(true);
    debouncedParticularSearch(value);
  };

  const handleSelectParticular = (value: string) => {
    setFormData((prev) => ({ ...prev, particular: value }));
    setShowParticularDropdown(false);
  };

  const handleSelectEntity = (entity: EntityOption) => {
    setSelectedEntity(entity);
    setEntitySearch(entity.name);
    setShowEntityDropdown(false);
    setFormData((prev) => ({ ...prev, entity: entity._id }));
  };

  const handleRemoveSelectedEntity = () => {
    setSelectedEntity(null);
    setEntitySearch("");
    setEntitySearchResults([]);
    setShowEntityDropdown(false);
    setFormData((prev) => ({ ...prev, entity: undefined }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "amount") {
      setFormData((prev) => {
        const newAmount = value === "" ? undefined : parseFloat(value) || 0;
        let newMethod = prev.method;
        if (newAmount && newAmount !== 0 && prev.method === "service_fee") {
          newMethod = "";
        }
        return {
          ...prev,
          amount: newAmount,
          method: newMethod,
        };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const getFormVisibility = useCallback(
    (
      recordKind?: Partial<TRecordData>["recordKind"],
      type?: Partial<TRecordData>["type"],
    ) => {
      const rawRecordKind = String(recordKind || "");
      const nextRecordKind =
        isEdit && rawRecordKind === "instant_profit"
          ? "standard"
          : rawRecordKind;
      const nextType = String(type || "");

      return {
        needsEntity: ["standard", "instant_profit", "liability"].includes(
          nextRecordKind,
        ),
        needsPaymentStatus: nextRecordKind === "standard",
        needsCategory: nextRecordKind === "office_records",
        allowsServiceFee:
          nextType === "expense" &&
          ["standard", "instant_profit"].includes(nextRecordKind),
        needsParticular: nextRecordKind !== "self_transfer",
        needsMethod:
          !["self_transfer", "liability"].includes(nextRecordKind),
        needsSwapMethods: nextRecordKind === "self_transfer",
      };
    },
    [isEdit],
  );

  const sanitizeFormDataByVisibility = useCallback(
    (draft: Partial<TRecordData> & { from?: string; to?: string }) => {
      const visibility = getFormVisibility(draft.recordKind, draft.type);
      const nextDraft: Partial<TRecordData> & { from?: string; to?: string } = {
        ...draft,
      };

      if (!visibility.needsEntity) {
        nextDraft.entity = undefined;
      }

      if (!visibility.needsPaymentStatus) {
        nextDraft.status = "";
      }

      if (!visibility.needsCategory) {
        nextDraft.category = "";
      }

      if (!visibility.allowsServiceFee) {
        nextDraft.serviceFee = 0;
      }

      if (!visibility.needsParticular) {
        nextDraft.particular = "";
      }

      if (!visibility.needsMethod) {
        nextDraft.method = "";
      }

      if (!visibility.needsSwapMethods) {
        nextDraft.from = "";
        nextDraft.to = "";
      }

      return nextDraft;
    },
    [getFormVisibility],
  );

  useEffect(() => {
    if (isEdit) return;

    const nextKind = String(searchParams.get("recordKind") || "")
      .trim()
      .toLowerCase();
    const nextType = String(searchParams.get("type") || "")
      .trim()
      .toLowerCase();

    const allowedKinds: RecordKind[] = [
      "standard",
      "office_records",
      "liability",
      "instant_profit",
      "self_transfer",
    ];
    const allowedTypes: RecordType[] = ["income", "expense"];

    const normalizedKind = allowedKinds.includes(nextKind as RecordKind)
      ? (nextKind as RecordKind)
      : undefined;
    const normalizedType = allowedTypes.includes(nextType as RecordType)
      ? (nextType as RecordType)
      : undefined;

    if (!normalizedKind && !normalizedType) return;

    setFormData((prev) => {
      const draft = {
        ...prev,
        recordKind: normalizedKind || prev.recordKind,
        type: normalizedType || prev.type,
      };
      return sanitizeFormDataByVisibility(draft);
    });
  }, [isEdit, sanitizeFormDataByVisibility, searchParams]);

  const handleRecordKindChange = (kind: RecordKind) => {
    const visibility = getFormVisibility(kind, formData.type);

    if (!visibility.needsEntity) {
      setSelectedEntity(null);
      setEntitySearch("");
      setEntitySearchResults([]);
      setShowEntityDropdown(false);
    }

    if (!visibility.allowsServiceFee) {
      setClientFee("");
    }

    setFormData((prev) =>
      sanitizeFormDataByVisibility({ ...prev, recordKind: kind }),
    );
  };

  const handleTypeChange = (type: RecordType) => {
    const visibility = getFormVisibility(formData.recordKind, type);

    if (!visibility.allowsServiceFee) {
      setClientFee("");
    }

    setFormData((prev) => sanitizeFormDataByVisibility({ ...prev, type }));
  };

  const getApplicableStatuses = () => {
    if (!formData.type) return [];
    return paymentStatuses.filter((status) => {
      if (!status.appliesTo) return true;
      if (status.appliesTo === "both") return true;
      return status.appliesTo === formData.type;
    });
  };

  const displayPaymentMethods = useMemo(() => {
    const methods = [...paymentMethods];
    if (
      !isEdit &&
      formData.type === "expense" &&
      formData.recordKind === "standard" &&
      formData.amount === 0
    ) {
      methods.push({
        id: "service_fee",
        label: "Service Fee",
        method: "Service Fee",
        color: "#f59e0b",
        icon: "invoice",
      });
    }
    return methods;
  }, [paymentMethods, isEdit, formData.type, formData.recordKind, formData.amount]);

  const getEntityInitials = (name: string) => {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "EN";
  };

  const isLightHexColor = (value?: string) => {
    const hex = String(value || "")
      .trim()
      .replace("#", "");
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return false;

    const red = Number.parseInt(hex.slice(0, 2), 16);
    const green = Number.parseInt(hex.slice(2, 4), 16);
    const blue = Number.parseInt(hex.slice(4, 6), 16);
    const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

    return brightness > 160;
  };

  const getReadableTextClass = (color?: string) =>
    isLightHexColor(color) ? "text-slate-900" : "text-white";
  const getReadableIconWrapClass = (color?: string) =>
    isLightHexColor(color)
      ? "bg-black/10 text-slate-900"
      : "bg-white/20 text-white";

  const getRecordKindSelectedColor = (kind: RecordKind) => {
    switch (kind) {
      case "standard":
        return "#2563eb";
      case "office_records":
        return "#d97706";
      case "liability":
        return "#dc2626";
      case "instant_profit":
        return "#7c3aed";
      case "self_transfer":
        return "#0891b2";
      default:
        return "#2563eb";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || formData.amount <= 0) {
      toast.error("Amount is required and must be greater than 0");
      return;
    }

    const {
      needsParticular,
      needsMethod,
      needsSwapMethods,
      needsPaymentStatus,
    } = getFormVisibility(formData.recordKind, formData.type);

    if (
      needsParticular &&
      (!formData.particular || formData.particular.trim() === "")
    ) {
      toast.error("Description/Particular is required");
      return;
    }

    if (needsEntity && !formData.entity) {
      toast.error("Entity is required");
      return;
    }

    if (needsCategory && !formData.category) {
      toast.error("Category is required");
      return;
    }

    if (needsMethod && !formData.method) {
      toast.error("Payment method is required");
      return;
    }

    if (needsSwapMethods && (!formData.from || !formData.to)) {
      toast.error("From and To payment methods are required");
      return;
    }

    if (needsSwapMethods && formData.from === formData.to) {
      toast.error("From and To payment methods must be different");
      return;
    }

    if (allowsServiceFee && clientFee === "") {
      toast.error("Client Fee is required");
      return;
    }

    if (needsPaymentStatus && !formData.status) {
      toast.error("Payment status is required");
      return;
    }

    setLoading(true);

    try {
      const recordData = buildRecordPayload();

      let successMessage = "Record created successfully!";

      if (isEdit && recordId) {
        const editEndpoint =
          formData.recordKind === "self_transfer"
            ? `/api/payment/self-deposit/${recordId}`
            : `/api/payment/${recordId}`;
        await axios.put(editEndpoint, recordData);
        successMessage = "Record updated successfully!";
      } else {
        let endpoint = "/api/payment";
        if (formData.recordKind === "self_transfer") {
          endpoint = "/api/payment/self-deposit";
        } else if (formData.recordKind === "instant_profit") {
          endpoint = "/api/payment/profit";
        }
        await axios.post(endpoint, recordData);
      }

      toast.success(successMessage);
      router.push("/accounts/transactions");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error.message ||
        "Failed to save record";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const visibility = getFormVisibility(formData.recordKind, formData.type);
  const needsEntity = visibility.needsEntity;
  const needsPaymentStatus = visibility.needsPaymentStatus;
  const needsCategory = visibility.needsCategory;
  const allowsServiceFee = visibility.allowsServiceFee;
  const needsParticular = visibility.needsParticular;
  const needsMethod = visibility.needsMethod;
  const needsSwapMethods = visibility.needsSwapMethods;
  const isSelfTransferSwap = formData.recordKind === "self_transfer";
  const showCurrentEntityInEdit = isEdit && !needsEntity && !!selectedEntity;
  const amountValue = Number(formData.amount || 0);
  const clientFeeValue = typeof clientFee === "number" ? clientFee : 0;
  const autoServiceFee = allowsServiceFee
    ? clientFee === ""
      ? 0
      : Number((clientFeeValue - amountValue).toFixed(2))
    : Number(formData.serviceFee || 0);
  const transactionNumber = `${String(formData.suffix || "")}${formData.number ?? ""}`;
  const effectiveRecordKind =
    isEdit && formData.recordKind === "instant_profit"
      ? "standard"
      : formData.recordKind;
  const usesNeutralTheme = ["instant_profit", "self_transfer"].includes(
    effectiveRecordKind || "",
  );

const theme = usesNeutralTheme
    ? {
      panel: isDarkMode ? "#0f172a" : "#eff6ff", // Darkened slightly from #f8fbff
      border: isDarkMode ? "#1e293b" : "#dbeafe",
      soft: isDarkMode ? "#172554" : "#eef4ff",
      strong: isDarkMode ? "#60a5fa" : "#2563eb",
    }
    : formData.type === "income"
      ? {
        panel: isDarkMode ? "#0b1a13" : "#f0fdf4", // Darkened slightly from #fbfefc
        border: isDarkMode ? "#1f5138" : "#cdeed8",
        soft: isDarkMode ? "#10251b" : "#f2fbf4",
        strong: isDarkMode ? "#22c55e" : "#16a34a",
      }
      : {
        panel: isDarkMode ? "#1a1213" : "#fef2f2", // Darkened slightly from #fffafa
        border: isDarkMode ? "#5b2a2a" : "#f3cdcd",
        soft: isDarkMode ? "#241718" : "#fff4f4",
        strong: isDarkMode ? "#ef4444" : "#dc2626",
      };

  const createHeader = useMemo(() => {
    const kind = String(formData.recordKind || "").toLowerCase();
    const type = String(formData.type || "income").toLowerCase();
    const isExpense = type === "expense";

    if (kind === "instant_profit") {
      return {
        title: "Add Instant Profit",
        icon: <FiTrendingUp className="h-5 w-5" />,
      };
    }

    if (kind === "self_transfer") {
      return {
        title: "New Self Transfer",
        icon: <FiRefreshCw className="h-5 w-5" />,
      };
    }

    if (kind === "liability") {
      return {
        title: isExpense ? "New Liability Expense" : "New Liability Income",
        icon: isExpense ? (
          <FiTrendingDown className="h-5 w-5" />
        ) : (
          <FiTrendingUp className="h-5 w-5" />
        ),
      };
    }

    if (kind === "office_records") {
      return {
        title: isExpense ? "New Office Expense" : "New Office Income",
        icon: isExpense ? (
          <FiTrendingDown className="h-5 w-5" />
        ) : (
          <FiTrendingUp className="h-5 w-5" />
        ),
      };
    }

    return {
      title: isExpense ? "New Expense" : "New Income",
      icon: isExpense ? (
        <FiTrendingDown className="h-5 w-5" />
      ) : (
        <FiTrendingUp className="h-5 w-5" />
      ),
    };
  }, [formData.recordKind, formData.type]);

  const buildRecordPayload = useCallback(() => {
    const visibility = getFormVisibility(formData.recordKind, formData.type);
    const effectiveRecordKind =
      isEdit && formData.recordKind === "instant_profit"
        ? "standard"
        : formData.recordKind;

    const payload: any = {
      suffix: formData.suffix,
      number: formData.number,
      amount: formData.amount,
      type: formData.type,
      recordKind: effectiveRecordKind,
      remarks: formData.remarks,
      createdBy: createdById,
      serviceFee: visibility.allowsServiceFee ? autoServiceFee : 0,
    };

    if (visibility.needsParticular) {
      payload.particular = formData.particular;
    }

    if (visibility.needsMethod) {
      if (formData.method !== "service_fee") {
        payload.method = formData.method;
      }
    }

    if (visibility.needsSwapMethods) {
      payload.from = formData.from;
      payload.to = formData.to;
    }

    if (visibility.needsEntity && formData.entity) {
      payload.entity = formData.entity;
    }

    // Only send status if present and valid
    if (visibility.needsPaymentStatus && formData.status) {
      payload.status = formData.status;
    }

    if (visibility.needsCategory && formData.category) {
      payload.category = formData.category;
    }

    return payload;
  }, [autoServiceFee, createdById, formData, getFormVisibility, isEdit]);

  useEffect(() => {
    if (!allowsServiceFee) return;

    setFormData((prev) => {
      if (Number(prev.serviceFee || 0) === autoServiceFee) return prev;
      return {
        ...prev,
        serviceFee: autoServiceFee,
      };
    });
  }, [allowsServiceFee, autoServiceFee]);

  return (
    <div
      className="relative overflow-hidden rounded-[28px] border border-slate-200 p-4 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.25)] dark:border-slate-800 sm:p-6"
      style={{
        backgroundColor: theme.panel,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${theme.panel} 0%, ${theme.soft} 100%)`,
        }}
      />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mt-3 flex items-center gap-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {isEdit ? (
                "Edit Transaction"
              ) : (
                <>
                  <span
                    className={clsx(
                      "inline-flex h-8 w-8 items-center justify-center rounded-xl",
                      formData.type === "expense"
                        ? "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                        : "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
                    )}
                  >
                    {createHeader.icon}
                  </span>
                  {createHeader.title}
                </>
              )}
              {!usesNeutralTheme ? (
                <button
                  type="button"
                  onClick={() =>
                    handleTypeChange(
                      formData.type === "income" ? "expense" : "income",
                    )
                  }
                  className="text-[11px] pt-2 text-violet-500 font-semibold leading-[0px] transition-opacity duration-200 hover:opacity-90"
                >
                  Change
                </button>
              ) : null}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Clean, solid-color UI with strong contrast and a modern dashboard
              feel.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 lg:w-auto lg:items-end">
            <div className="self-start rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:self-auto">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Transaction No
                </p>
                {/* <button
                  type="button"
                  onClick={() => setIsEditingTransactionNumber((prev) => !prev)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
                  aria-label={
                    isEditingTransactionNumber
                      ? "Done editing transaction number"
                      : "Edit transaction number"
                  }
                  title={isEditingTransactionNumber ? "Done" : "Edit"}
                >
                  {isEditingTransactionNumber ? (
                    <FiCheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    <FiEdit2 className="h-3.5 w-3.5" />
                  )}
                </button> */}
              </div>

              {isEditingTransactionNumber ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={String(formData.suffix || "")}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        suffix: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Suffix"
                  />
                  <input
                    type="number"
                    min="0"
                    value={formData.number ?? 0}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        number: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Number"
                  />
                </div>
              ) : (
                <p className="mt-1.5 font-bold text-right tracking-tight text-slate-900 dark:text-slate-100">
                  {transactionNumber || "-"}
                </p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {recordKindTiles.map((tile) => {
              const selected = formData.recordKind === tile.kind;
              return (
                <button
                  key={tile.kind}
                  type="button"
                  onClick={() => {
                    if (isEdit) return;
                    handleRecordKindChange(tile.kind);
                  }}
                  disabled={isEdit}
                  className={`rounded-2xl border p-3 text-left transition-all duration-200 ${selected
                      ? "border-transparent shadow-lg"
                      : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                    } ${isEdit ? "cursor-not-allowed opacity-70" : ""}`}
                  style={
                    selected
                      ? {
                        backgroundColor: getRecordKindSelectedColor(
                          tile.kind,
                        ),
                        color: "#fff",
                      }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
                    >
                      {tile.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-extrabold tracking-tight">
                        {tile.label}
                      </span>
                      <span className="block text-[11px] font-medium opacity-90">
                        {tile.description}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-0">
              <div className="space-y-3">
                <div className="space-y-3">
                  {needsEntity && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                        Entity
                      </label>
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="text"
                          value={entitySearch}
                          onChange={(e) => handleEntitySearch(e.target.value)}
                          onFocus={() => setShowEntityDropdown(true)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pl-9 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                          style={{ boxShadow: `0 0 0 0 ${theme.strong}` }}
                          placeholder="Search entity..."
                        />
                        {entitySearchLoading && (
                          <FiLoader
                            className="absolute right-3 top-3 h-4 w-4 animate-spin"
                            style={{ color: theme.strong }}
                          />
                        )}

                        {showEntityDropdown &&
                          entitySearchResults.length > 0 && (
                            <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
                              {entitySearchResults.map((entity) => (
                                <button
                                  key={entity._id}
                                  type="button"
                                  onClick={() => handleSelectEntity(entity)}
                                  className="flex w-full items-center gap-2.5 border-b border-slate-200 px-3 py-2.5 text-left hover:bg-slate-100 last:border-b-0 dark:border-slate-800 dark:hover:bg-slate-900"
                                >
                                  <span
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                                    style={{
                                      backgroundColor:
                                        entity.color || "#64748b",
                                    }}
                                  >
                                    {getEntityInitials(entity.name)}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm text-slate-700 dark:text-slate-300">
                                      {entity.name}
                                    </span>
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                      {entity.entityType}
                                    </span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                      </div>

                      {selectedEntity && (
                        <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                          <span
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
                            style={{
                              backgroundColor:
                                selectedEntity.color || "#64748b",
                            }}
                          >
                            {getEntityInitials(selectedEntity.name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {selectedEntity.name}
                            </p>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                              {selectedEntity.entityType}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveSelectedEntity}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition-colors hover:border-red-300 hover:text-red-600 dark:border-slate-600 dark:text-slate-300 dark:hover:border-red-500 dark:hover:text-red-400"
                            aria-label="Remove selected entity"
                            title="Remove selected entity"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {needsCategory && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category || ""}
                        onChange={handleChange}
                        required={needsCategory}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="">Select office category...</option>
                        {officeExpenseCategories.map((categoryOption) => (
                          <option
                            key={categoryOption.id}
                            value={categoryOption.id}
                          >
                            {categoryOption.label || categoryOption.category}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {showCurrentEntityInEdit ? (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                        Current Entity
                      </label>
                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{
                            backgroundColor: selectedEntity?.color || "#64748b",
                          }}
                        >
                          {getEntityInitials(selectedEntity?.name || "EN")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {selectedEntity?.name || "Current entity"}
                          </p>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            {selectedEntity?.entityType || "company"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {needsParticular && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                        Particular
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.particular || ""}
                          onChange={(e) =>
                            handleParticularSearch(e.target.value)
                          }
                          onFocus={() => setShowParticularDropdown(true)}
                          required
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                          placeholder="Search particular templates..."
                        />
                        {particularLoading && (
                          <FiLoader
                            className="absolute right-3 top-3 h-4 w-4 animate-spin"
                            style={{ color: theme.strong }}
                          />
                        )}
                        {showParticularDropdown &&
                          particularSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
                              {particularSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  onClick={() =>
                                    handleSelectParticular(suggestion)
                                  }
                                  className="w-full border-b border-slate-200 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100 last:border-b-0 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>

                <div className={clsx("grid gap-3", allowsServiceFee && "md:grid-cols-2")}>
                  {allowsServiceFee ? (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                        Client Fee
                      </label>
                      <input
                        type="number"
                        value={clientFee}
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => {
                          setClientFee(
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value) || 0,
                          );
                        }}
                        step="0.01"
                        min="0"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                        placeholder="0.00"
                      />
                      <div className="mt-1.5 flex items-center gap-2 whitespace-nowrap">
                        <p className="text-[11px] font-semibold uppercase tracking-wide">
                          Service Fee:{" "}
                          <span
                            className={
                              autoServiceFee < 0
                                ? "text-red dark:text-red"
                                : "text-green-600 dark:text-green-400"
                            }
                          >
                            AED {autoServiceFee.toFixed(2)}
                          </span>
                        </p>

                        {autoServiceFee < 0 ? (
                          <div className="inline-flex items-center gap-1.5 rounded-lg border-[0.5px] border-amber-300 bg-amber-50 px-2 text-[0.65rem] font-semibold text-amber-800 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-300">
                            <FiAlertTriangle className="h-2.5 w-2.5" />
                            Service fee is in loss
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                      Amount
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount ?? ""}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      required
                      className={clsx("w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100", needsSwapMethods && "text-5xl")}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {needsMethod && (
              <div className="space-y-5 my-6">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
                  <FiCreditCard className="h-4 w-4" />
                  Payment Method
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {displayPaymentMethods.map((method) => {
                    const Icon = getPaymentMethodIcon(
                      (method.icon || "card") as TPaymentTemplateIcon,
                    );
                    const selectedMethodColor = method.color || "#2563eb";
                    const selectedTextClass =
                      getReadableTextClass(selectedMethodColor);
                    const selectedIconWrapClass =
                      getReadableIconWrapClass(selectedMethodColor);

                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            method: method.id,
                          }))
                        }
                        className={`rounded-xl border p-2 text-left transition-all duration-200 ${formData.method === method.id
                            ? `border-transparent shadow-lg ${selectedTextClass}`
                            : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
                          }`}
                        style={
                          formData.method === method.id
                            ? { backgroundColor: selectedMethodColor }
                            : undefined
                        }
                      >
                        <div className="flex flex-col items-center gap-1.5 text-center">
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${formData.method === method.id ? selectedIconWrapClass : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span
                            className={`text-[11px] font-semibold leading-tight ${formData.method === method.id ? selectedTextClass : "text-slate-700 dark:text-slate-300"}`}
                          >
                            {method.label || method.method}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {needsSwapMethods && (
              <div className="space-y-6 my-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div
                    className={clsx(
                      "space-y-5",
                      isSelfTransferSwap &&
                      "rounded-2xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-800/40 dark:bg-rose-900/10",
                    )}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
                      <FiArrowDownLeft className="h-4 w-4" />
                      From Account
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                      {paymentMethods.map((method) => {
                        const Icon = getPaymentMethodIcon(
                          (method.icon || "card") as TPaymentTemplateIcon,
                        );
                        const selectedMethodColor = method.color || "#dc2626";
                        const selectedTextClass =
                          getReadableTextClass(selectedMethodColor);
                        const selectedIconWrapClass =
                          getReadableIconWrapClass(selectedMethodColor);
                        const methodValue = method.label || method.method;

                        return (
                          <button
                            key={`from-${method.id}`}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                from: methodValue,
                              }))
                            }
                            className={`rounded-xl border p-2 text-left transition-all duration-200 ${formData.from === methodValue
                                ? `border-transparent shadow-lg ${selectedTextClass}`
                                : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
                              }`}
                            style={
                              formData.from === methodValue
                                ? { backgroundColor: selectedMethodColor }
                                : undefined
                            }
                          >
                            <div className="flex flex-col items-center gap-1.5 text-center">
                              <span
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${formData.from === methodValue ? selectedIconWrapClass : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                              <span
                                className={`text-[11px] font-semibold leading-tight ${formData.from === methodValue ? selectedTextClass : "text-slate-700 dark:text-slate-300"}`}
                              >
                                {method.label || method.method}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    className={clsx(
                      "space-y-5",
                      isSelfTransferSwap &&
                      "rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800/40 dark:bg-emerald-900/10",
                    )}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
                      <FiArrowUpRight className="h-4 w-4" />
                      To Account
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                      {paymentMethods.map((method) => {
                        const Icon = getPaymentMethodIcon(
                          (method.icon || "card") as TPaymentTemplateIcon,
                        );
                        const selectedMethodColor = method.color || "#16a34a";
                        const selectedTextClass =
                          getReadableTextClass(selectedMethodColor);
                        const selectedIconWrapClass =
                          getReadableIconWrapClass(selectedMethodColor);
                        const methodValue = method.label || method.method;

                        return (
                          <button
                            key={`to-${method.id}`}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                to: methodValue,
                              }))
                            }
                            className={`rounded-xl border p-2 text-left transition-all duration-200 ${formData.to === methodValue
                                ? `border-transparent shadow-lg ${selectedTextClass}`
                                : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
                              }`}
                            style={
                              formData.to === methodValue
                                ? { backgroundColor: selectedMethodColor }
                                : undefined
                            }
                          >
                            <div className="flex flex-col items-center gap-1.5 text-center">
                              <span
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${formData.to === methodValue ? selectedIconWrapClass : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                              <span
                                className={`text-[11px] font-semibold leading-tight ${formData.to === methodValue ? selectedTextClass : "text-slate-700 dark:text-slate-300"}`}
                              >
                                {method.label || method.method}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {needsPaymentStatus && (
              <div className="space-y-5 my-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
                    <FiCheckCircle className="h-4 w-4" />
                    Payment Status
                  </div>
                  {getApplicableStatuses().map((status) => {
                    const selectedStatusColor = status.color || "#16a34a";
                    const selectedTextClass =
                      getReadableTextClass(selectedStatusColor);

                    return (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            status: status.id,
                          }))
                        }
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all duration-200 ${formData.status === status.id
                            ? `border-transparent shadow-lg ${selectedTextClass}`
                            : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-600"
                          }`}
                        style={
                          formData.status === status.id
                            ? { backgroundColor: selectedStatusColor }
                            : undefined
                        }
                      >
                        <span>{status.label || status.status}</span>
                        <span
                          className={`text-[10px] uppercase tracking-[0.18em] opacity-80 ${formData.status === status.id ? selectedTextClass : "text-slate-400"}`}
                        >
                          {status.appliesTo || "both"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                  Notes
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks || ""}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  rows={2}
                  placeholder="Optional remarks or notes..."
                />
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-600 dark:bg-slate-900"
              style={{ color: "#374151" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:shadow-none"
              style={{
                backgroundColor: theme.strong,
                boxShadow: `0 14px 30px -18px ${theme.strong}`,
              }}
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <FiSave />
                  {isEdit
                    ? "Update Record"
                    : createHeader.title.startsWith("New ")
                      ? `Create ${createHeader.title.slice(4)}`
                      : createHeader.title.startsWith("Add ")
                        ? `Create ${createHeader.title.slice(4)}`
                        : `Create ${createHeader.title}`}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleRecordForm;
