"use client";
import { TRecordList } from "@/types/records";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import SkeletonList from "../common/SkeletonList";
import CardDataStats from "../CardDataStats";
import Breadcrumb from "../Breadcrumbs/Breadcrumb";
import EntityAvatar from "../common/EntityAvatar";
import PaymentMethodBadge from "../common/PaymentMethodBadge";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { formatDateTime, formatRelativeDate } from "@/utils/dateUtils";
import { useUserContext } from "@/contexts/UserContext";
import {
  exportRowsCsv,
  exportRowsExcel,
  exportRowsPdf,
} from "@/utils/exportTableData";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiFilter,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiArrowRight,
  FiPlusCircle,
  FiInfo,
  FiTrash2,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiDownload,
  FiFileText,
} from "react-icons/fi";

type TPaymentMethodOption = {
  value: string;
  label: string;
  color?: string;
  icon?: string;
};

type TPaymentStatusOption = {
  value: string;
  label: string;
  color?: string;
};

type TEntityOption = {
  _id: string;
  name: string;
  entityType: "company" | "employee" | "individual";
  color?: string;
};

type TOfficeCategoryOption = {
  id: string;
  label: string;
};

type TCompanyOption = {
  _id: string;
  name: string;
  color?: string;
  entityType?: "company";
};

type ExportScope = "selected" | "page" | "all";
type ExportFormat = "csv" | "excel" | "pdf";

const baseData = {
  t: "",
  m: "",
  s: "",
  k: "",
  e: "",
  oc: "",
  ec: "",
};

type LedgerCategory = "office_records" | "liability";

const INVOICE_PREFILL_STORAGE_KEY = "zaad.invoice.prefill";

const formatTransactionListDate = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  if (isYesterday) {
    return "Yesterday";
  }

  return formatRelativeDate(dateString);
};

const getEditCountText = (count: number): string => {
  if (count === 1) return "edited once";
  if (count === 2) return "edited twice";
  return `edited ${count} times`;
};

const getTransactionAvatar = (record: TRecordList) => {
  const status = (record?.status || "").toLowerCase();
  const particular = (record?.particular || "").toLowerCase();
  const isSelf = record?.client?.type === "self";

  const isSelfTransfer =
    status.includes("self deposit") ||
    particular.includes("money removed from") ||
    particular.includes("money recieved as exchange") ||
    particular.includes("money received as exchange");

  // Office record: always use logo.svg
  if (record?.recordKind === "office_records") {
    return (
      <div className="flex items-center justify-center">
        <Image
          src="/images/logo/logo-icon.svg"
          className="h-8 w-8 rounded-xl"
          alt="Office"
          width={24}
          height={24}
        />
      </div>
    );
  }

  // Self-deposit: use swap icon
  if (isSelfTransfer) {
    const isOut = record?.type === "expense";
    return (
      <div
        className={clsx(
          "flex items-center justify-center h-8 w-8 rounded-xl shadow-inner ring-1 ring-white/20",
          isOut
            ? "bg-rose-100 dark:bg-rose-500/20"
            : "bg-emerald-100 dark:bg-emerald-500/20",
        )}
      >
        {isOut ? (
          <FiArrowDownLeft className="h-4 w-4 text-rose-600 dark:text-rose-300" />
        ) : (
          <FiArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
        )}
      </div>
    );
  }

  // Default: use entity avatar with initials
  return (
    <EntityAvatar
      name={record?.client?.name || "Unknown"}
      color={record?.client?.color}
      size="sm"
    />
  );
};

const getTransactionVisual = (record: TRecordList) => {
  const status = (record?.status || "").toLowerCase();
  const particular = (record?.particular || "").toLowerCase();
  const isSelf = record?.client?.type === "self";
  const isOfficeRecord = record?.recordKind === "office_records";

  const isSelfTransfer =
    status.includes("self deposit") ||
    particular.includes("money removed from") ||
    particular.includes("money recieved as exchange") ||
    particular.includes("money received as exchange");

  const isInstantProfit = status === "profit";
  const isLiability = status.includes("liability");
  const isOfficeExpense =
    status.includes("office expense") || particular.includes("office expense");
  const isCompanyExpense =
    isSelf &&
    record?.type === "expense" &&
    (isOfficeExpense || status.includes("debit"));

  if (isOfficeRecord) {
    if (record?.type === "income") {
      return {
        label: "Office Income",
        badgeClass:
          "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
        amountClass: "text-emerald-600 dark:text-emerald-400",
      };
    }

    return {
      label: "Office Expense",
      badgeClass:
        "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
      amountClass: "text-rose-600 dark:text-rose-400",
    };
  }

  if (isSelfTransfer) {
    if (record?.type === "income") {
      return {
        label: "Self Transfer In",
        badgeClass:
          "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/30",
        amountClass: "text-cyan-600 dark:text-cyan-400",
      };
    }

    return {
      label: "Self Transfer Out",
      badgeClass:
        "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30",
      amountClass: "text-blue-600 dark:text-blue-400",
    };
  }

  if (isInstantProfit) {
    if (record?.type === "income") {
      return {
        label: "Instant Profit In",
        badgeClass:
          "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
        amountClass: "text-emerald-600 dark:text-emerald-400",
      };
    }

    return {
      label: "Instant Profit Out",
      badgeClass:
        "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
      amountClass: "text-rose-600 dark:text-rose-400",
    };
  }

  if (isCompanyExpense) {
    return {
      label: "Office Expense",
      badgeClass:
        "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-inset ring-fuchsia-500/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:ring-fuchsia-500/30",
      amountClass: "text-fuchsia-600 dark:text-fuchsia-400",
    };
  }

  if (isLiability) {
    return {
      label: "Liability",
      badgeClass:
        "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
      amountClass: "text-amber-600 dark:text-amber-400",
    };
  }

  if (record?.type === "income") {
    return {
      label: "Income",
      badgeClass:
        "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
      amountClass: "text-emerald-600 dark:text-emerald-400",
    };
  }

  return {
    label: "Expense",
    badgeClass:
      "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
    amountClass: "text-rose-600 dark:text-rose-400",
  };
};

const TransactionList = ({
  type,
  id,
  category,
  embedded = false,
  lockEntityType,
  lockEntityId,
  lockEntityName,
  returnTo,
}: {
  type?: string | string[];
  id?: string | string[];
  category?: LedgerCategory;
  embedded?: boolean;
  lockEntityType?: string;
  lockEntityId?: string;
  lockEntityName?: string;
  returnTo?: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserContext();
  const isAdmin = ["admin", "superadmin"].includes(
    (user?.role || "").toLowerCase(),
  );

  const [pageNumber, setPageNumber] = useState(0);
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [filterDummy, setFilterDummy] = useState({ ...baseData });
  const [filter, setFilter] = useState({ ...baseData });
  const [hasMore, setHasMore] = useState(true);
  const [records, setRecords] = useState<TRecordList[]>([]);
  const [recordsWithBalance, setRecordsWithBalance] = useState<
    (TRecordList & { runningBalance?: number })[]
  >([]);
  const [cards, setCards] = useState([0, 0, 0, 0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [pageSize, setPageSize] = useState(25);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [exportScope, setExportScope] = useState<ExportScope>("selected");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [entitySearchInput, setEntitySearchInput] = useState("");
  const [entitySearchResults, setEntitySearchResults] = useState<
    TEntityOption[]
  >([]);
  const [entitySearchLoading, setEntitySearchLoading] = useState(false);
  const [companySearchInput, setCompanySearchInput] = useState("");
  const [companySearchResults, setCompanySearchResults] = useState<
    TCompanyOption[]
  >([]);
  const [companySearchLoading, setCompanySearchLoading] = useState(false);
  const [selectedEmployeeCompany, setSelectedEmployeeCompany] =
    useState<TCompanyOption | null>(null);
  const [selectedEntityMap, setSelectedEntityMap] = useState<
    Record<string, TEntityOption>
  >({});

  const currentType = Array.isArray(type) ? type[0] : type;
  const hasLedgerContext = Boolean(currentType || category);

  useEffect(() => {
    const nextFilter = {
      t: String(searchParams.get("t") || "").trim(),
      m: String(searchParams.get("m") || "").trim(),
      s: String(searchParams.get("s") || "").trim(),
      k: String(searchParams.get("k") || "").trim(),
      e: String(searchParams.get("e") || "").trim(),
      oc: String(searchParams.get("oc") || "").trim(),
      ec: String(searchParams.get("ec") || "").trim(),
    };
    const nextSearch = String(searchParams.get("q") || "").trim();
    const nextSort = String(searchParams.get("sort") || "newest").trim();
    const nextLimit = Number(searchParams.get("limit") || "25");

    setFilter(nextFilter);
    setFilterDummy(nextFilter);
    setSearchTerm(nextSearch);
    setSortBy(nextSort || "newest");
    setPageSize(Number.isFinite(nextLimit) && nextLimit > 0 ? nextLimit : 25);
    setPageNumber(0);
  }, [searchParams]);

  const { data: paymentData, isLoading } = useQuery({
    queryKey: [
      "payment",
      pageNumber,
      pageSize,
      sortBy,
      type,
      id,
      category,
      filter,
    ],
    queryFn: async () => {
      const routeSegment = currentType
        ? currentType === "self" || currentType === "self-deposit"
          ? `/${currentType}`
          : `/${currentType}/${id}`
        : "";
      const params = new URLSearchParams();
      params.set("page", String(pageNumber));
      params.set("limit", String(pageSize));
      params.set("sort", sortBy);
      if (filter.t) params.set("t", filter.t);
      if (filter.m) params.set("m", filter.m);
      if (filter.s) params.set("s", filter.s);
      if (filter.k) params.set("k", filter.k);
      if (filter.e) params.set("e", filter.e);
      if (filter.oc) params.set("oc", filter.oc);
      if (filter.ec) params.set("ec", filter.ec);
      if (category) params.set("category", category);
      const res = await axios.get(
        `/api/payment${routeSegment}?${params.toString()}`,
      );
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const { data: paymentMethodOptions = [] } = useQuery<TPaymentMethodOption[]>({
    queryKey: ["payment-method-templates"],
    queryFn: async () => {
      const { data } = await axios.get("/api/templates", {
        params: { type: "payment" },
      });
      return (data?.options || []).map((item: any) => ({
        value: item.id,
        label: item.label || item.method,
        color: item.color,
        icon: item.icon,
      }));
    },
  });

  const { data: paymentStatusOptions = [] } = useQuery<TPaymentStatusOption[]>({
    queryKey: ["payment-status-templates"],
    queryFn: async () => {
      const { data } = await axios.get("/api/templates", {
        params: { type: "status" },
      });
      return (data?.options || data?.paymentStatusOptions || []).map(
        (item: any) => ({
          value: item.id || item._id || item.status,
          label: item.label || item.status,
          color: item.color,
        }),
      );
    },
  });

  const { data: officeCategoryOptions = [] } = useQuery<
    TOfficeCategoryOption[]
  >({
    queryKey: ["office-expense-category-options"],
    queryFn: async () => {
      const { data } = await axios.get("/api/templates");
      return (data?.officeExpenseCategoryOptions || []).map((item: any) => ({
        id: item.id,
        label: item.label || item.category || "Office",
      }));
    },
  });

  useEffect(() => {
    const keyword = entitySearchInput.trim();
    if (!keyword || keyword.length < 2) {
      setEntitySearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setEntitySearchLoading(true);
      try {
        const [companies, employees, individuals] = await Promise.all([
          axios.get<TEntityOption[]>(`/api/company/search/${keyword}`),
          axios.get<TEntityOption[]>(`/api/employee/search/${keyword}`),
          axios.get<TEntityOption[]>(`/api/individual/search/${keyword}`),
        ]);

        const merged = [
          ...(companies.data || []).map((row: any) => ({
            ...row,
            entityType: "company" as const,
          })),
          ...(employees.data || []).map((row: any) => ({
            ...row,
            entityType: "employee" as const,
          })),
          ...(individuals.data || []).map((row: any) => ({
            ...row,
            entityType: "individual" as const,
          })),
        ];

        setEntitySearchResults(merged.slice(0, 12));
      } catch {
        setEntitySearchResults([]);
      } finally {
        setEntitySearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [entitySearchInput]);

  useEffect(() => {
    const keyword = companySearchInput.trim();
    if (!keyword || keyword.length < 2) {
      setCompanySearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCompanySearchLoading(true);
      try {
        const { data } = await axios.get<TCompanyOption[]>(
          `/api/company/search/${keyword}`,
        );
        setCompanySearchResults((data || []).slice(0, 12));
      } catch {
        setCompanySearchResults([]);
      } finally {
        setCompanySearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [companySearchInput]);

  const paymentMethodMap = useMemo(() => {
    return paymentMethodOptions.reduce<Record<string, TPaymentMethodOption>>(
      (acc, item) => {
        acc[item.value] = item;
        return acc;
      },
      {},
    );
  }, [paymentMethodOptions]);

  useEffect(() => {
    if (paymentData) {
      setRecords(paymentData.records);
      setHasMore(paymentData.hasMore);

      if (hasLedgerContext && paymentData.records?.length > 0) {
        const { balance, totalIncome, totalExpense, totalTransactions } =
          paymentData;
        setCards([balance, totalIncome, totalExpense, totalTransactions]);

        const recordsWithRunningBalance = [...paymentData.records];
        let runningBalance = balance;

        for (let i = 0; i < recordsWithRunningBalance.length; i++) {
          const record = recordsWithRunningBalance[i];
          recordsWithRunningBalance[i] = { ...record, runningBalance };

          const amount = parseFloat(record.amount) || 0;
          const serviceFee = parseFloat(record.serviceFee) || 0;

          if (
            record.type === "income" &&
            !(record.status || "").toLowerCase().includes("liability")
          ) {
            runningBalance -= amount;
          } else if (record.type === "expense") {
            runningBalance += amount + serviceFee;
          }
        }
        setRecordsWithBalance(recordsWithRunningBalance);
      } else {
        setRecordsWithBalance(paymentData.records || []);
      }
    }
  }, [paymentData, hasLedgerContext]);

  const visibleRecords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return recordsWithBalance;

    return recordsWithBalance.filter((record) => {
      const haystack = [
        `${record?.suffix || ""}${record?.number || ""}`,
        record?.client?.name ||
          (record?.recordKind === "office_records"
            ? record?.categoryName || ""
            : ""),
        record?.client?.type || "",
        record?.particular || "",
        record?.method || "",
        record?.status || "",
        record?.amount || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [recordsWithBalance, searchTerm]);

  const selectedRecords = useMemo(
    () =>
      visibleRecords.filter(
        (record) => record?.id && selectedRecordIds.includes(record.id),
      ),
    [selectedRecordIds, visibleRecords],
  );

  const allVisibleSelected =
    visibleRecords.length > 0 &&
    visibleRecords.every(
      (record) => record?.id && selectedRecordIds.includes(record.id),
    );

  const isInnerEntityRecords =
    embedded && Boolean(lockEntityType) && Boolean(lockEntityId);
  const enableSelection = true;
  const hasActiveFilter =
    Boolean(filter.m) ||
    Boolean(filter.t) ||
    Boolean(filter.s) ||
    Boolean(filter.k) ||
    Boolean(filter.e) ||
    Boolean(filter.oc) ||
    Boolean(filter.ec);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.t) count += 1;
    if (filter.m) count += 1;
    if (filter.s) count += 1;
    if (filter.k) count += 1;
    if (filter.oc) count += 1;
    if (filter.e) count += filter.e.split(",").filter(Boolean).length;
    if (filter.ec) count += 1;
    return count;
  }, [filter]);

  const selectedEntityIds = useMemo(
    () =>
      (filterDummy.e || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    [filterDummy.e],
  );

  useEffect(() => {
    if (!entitySearchResults.length || !selectedEntityIds.length) return;
    setSelectedEntityMap((prev) => {
      const next = { ...prev };
      for (const row of entitySearchResults) {
        if (selectedEntityIds.includes(row._id)) {
          next[row._id] = row;
        }
      }
      return next;
    });
  }, [entitySearchResults, selectedEntityIds]);

  useEffect(() => {
    if (!filterDummy.ec) {
      setSelectedEmployeeCompany(null);
      return;
    }
    const found = companySearchResults.find((company) => company._id === filterDummy.ec);
    if (found) {
      setSelectedEmployeeCompany(found);
    }
  }, [companySearchResults, filterDummy.ec]);

  const toggleSelectVisible = (checked: boolean) => {
    if (!checked) {
      const visibleIds = new Set(visibleRecords.map((record) => record.id));
      setSelectedRecordIds((prev) => prev.filter((id) => !visibleIds.has(id)));
      return;
    }

    const visibleIds = visibleRecords.map((record) => record.id);
    setSelectedRecordIds((prev) =>
      Array.from(new Set([...prev, ...visibleIds])),
    );
  };

  const toggleRecordSelection = (recordId: string, checked: boolean) => {
    if (!recordId) return;
    setSelectedRecordIds((prev) => {
      if (checked) {
        return prev.includes(recordId) ? prev : [...prev, recordId];
      }
      return prev.filter((id) => id !== recordId);
    });
  };

  const mapRecordsForExport = (
    rows: (TRecordList & { runningBalance?: number })[],
  ) =>
    rows.map((record) => {
      const amount = Number(record.amount || 0);
      const serviceFee = Number(record.serviceFee || 0);
      return {
        "Record ID": `${record.suffix || ""}${record.number || ""}`,
        Client:
          record.recordKind === "office_records"
            ? record.categoryName || "Office Record"
            : record.client?.name || "",
        "Client Type": record.client?.type || "",
        Type: record.type || "",
        Particular: record.particular || "",
        Method: record.method || "",
        Status: record.status || "",
        "Amount (AED)": amount.toFixed(2),
        "Service Fee (AED)": serviceFee.toFixed(2),
        "Effective Total (AED)":
          record.type === "expense"
            ? (amount + serviceFee).toFixed(2)
            : amount.toFixed(2),
        Date: formatDateTime(record.createdAt || record.dateTime || null),
      };
    });

  const handleExport = async () => {
    let sourceRows: (TRecordList & { runningBalance?: number })[] = [];

    if (exportScope === "selected") {
      sourceRows = selectedRecords;
    } else if (exportScope === "page") {
      sourceRows = visibleRecords;
    } else {
      const routeSegment = currentType
        ? currentType === "self" || currentType === "self-deposit"
          ? `/${currentType}`
          : `/${currentType}/${id}`
        : "";

      const allRows: (TRecordList & { runningBalance?: number })[] = [];
      let cursor = 0;
      let keepLoading = true;

      while (keepLoading) {
        const params = new URLSearchParams();
        params.set("page", String(cursor));
        params.set("limit", "100");
        params.set("sort", sortBy);
        if (filter.t) params.set("t", filter.t);
        if (filter.m) params.set("m", filter.m);
        if (filter.s) params.set("s", filter.s);
        if (filter.k) params.set("k", filter.k);
        if (filter.e) params.set("e", filter.e);
        if (filter.oc) params.set("oc", filter.oc);
        if (filter.ec) params.set("ec", filter.ec);
        if (category) params.set("category", category);

        const { data } = await axios.get(
          `/api/payment${routeSegment}?${params.toString()}`,
        );
        const batch = (data?.records || []) as (TRecordList & {
          runningBalance?: number;
        })[];
        allRows.push(...batch);
        keepLoading = Boolean(data?.hasMore);
        cursor += 1;
      }

      if (searchTerm.trim()) {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        sourceRows = allRows.filter((record) => {
          const haystack = [
            `${record?.suffix || ""}${record?.number || ""}`,
            record?.client?.name ||
              (record?.recordKind === "office_records"
                ? record?.categoryName || ""
                : ""),
            record?.client?.type || "",
            record?.particular || "",
            record?.method || "",
            record?.status || "",
            record?.amount || "",
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(normalizedSearch);
        });
      } else {
        sourceRows = allRows;
      }
    }

    if (!sourceRows.length) {
      toast.error(
        exportScope === "selected"
          ? "Select records to export"
          : "No records available to export",
      );
      return;
    }

    const rows = mapRecordsForExport(sourceRows);
    const filePrefix = `${lockEntityName || currentType || "records"}-records`;

    if (exportFormat === "csv") {
      exportRowsCsv(rows, filePrefix);
      toast.success("CSV exported");
      return;
    }

    if (exportFormat === "excel") {
      exportRowsExcel(rows, filePrefix);
      toast.success("Excel exported");
      return;
    }

    await exportRowsPdf(rows, filePrefix);
    toast.success("PDF exported");
  };

  const handleConvertSelectedToInvoice = async () => {
    if (!selectedRecords.length) {
      toast.error("Select records first");
      return;
    }

    const expenseItems = selectedRecords
      .filter((record) => record.type === "expense")
      .map((record) => {
        const amount = Number(record.amount || 0);
        const serviceFee = Number(record.serviceFee || 0);
        const total = amount + serviceFee;

        const descriptionParts: string[] = [];
        if (
          record.client?.type === "employee" ||
          record.client?.type === "individual"
        ) {
          descriptionParts.push(
            `Employee: ${record.client?.name || "Unknown"}`,
          );
        } else {
          descriptionParts.push(`Company: ${record.client?.name || "Unknown"}`);
          if (record.employeeName) {
            descriptionParts.push(`Employee: ${record.employeeName}`);
          }
        }
        descriptionParts.push(record.method || "Unknown method");

        return {
          title:
            record.particular ||
            `Expense ${record.suffix || ""}${record.number || ""}`,
          desc: descriptionParts.join(" | "),
          rate: Number(total.toFixed(2)),
          quantity: 1,
        };
      });

    if (!expenseItems.length) {
      toast.error("Selected records must include at least one expense record");
      return;
    }

    const advance = selectedRecords
      .filter((record) => record.type === "income")
      .reduce((sum, record) => sum + Number(record.amount || 0), 0);

    const today = new Date();
    const validTo = new Date(today);
    validTo.setDate(validTo.getDate() + 30);

    const entityType =
      lockEntityType === "company" ||
      lockEntityType === "employee" ||
      lockEntityType === "individual"
        ? lockEntityType
        : null;

    const prefillPayload = {
      connectionMode: entityType ? "connected" : "detached",
      selectedEntityType: entityType,
      selectedEntitySummary:
        entityType && lockEntityId
          ? {
              id: lockEntityId,
              name:
                lockEntityName || selectedRecords[0]?.client?.name || "Client",
              type: entityType,
            }
          : null,
      invoiceData: {
        quotation: "false",
        message: "",
        trn: "",
        createdBy: user?._id,
        client: lockEntityName || selectedRecords[0]?.client?.name || "Client",
        entityId: lockEntityId || null,
        entityType,
        date: today.toISOString().split("T")[0],
        validTo: validTo.toISOString().split("T")[0],
        items: expenseItems,
        remarks: `Generated from ${selectedRecords.length} selected record(s)`,
        advance: Number(advance.toFixed(2)),
        location: "",
        purpose: "Records to Invoice",
        amount: 0,
        showBalance: "show",
        balance: 0,
      },
      createdAt: Date.now(),
    };

    try {
      sessionStorage.setItem(
        INVOICE_PREFILL_STORAGE_KEY,
        JSON.stringify(prefillPayload),
      );
      setSelectedRecordIds([]);
      toast.success("Invoice draft prepared from selected records");

      const params = new URLSearchParams();
      params.set("prefill", "records");
      if (returnTo) {
        params.set("returnTo", returnTo);
      }

      router.push(`/accounts/invoice/new?${params.toString()}`);
    } catch (error) {
      toast.error("Failed to prepare invoice draft from selected records");
      console.error(error);
    }
  };

  const handlePageChange = (page: number) => {
    setPageNumber(page);
    setSelectedRecordIds([]);
  };

  const handleFilter = () => {
    setFilter(filterDummy);
    setFilterOpen(false);
    setPageNumber(0);
    setSelectedRecordIds([]);
  };

  const handleCancelFilter = () => {
    setFilterDummy({ ...filter });
    setFilterOpen(false);
  };

  const addEntityToFilter = (entity: TEntityOption) => {
    if (!entity?._id) return;
    const merged = Array.from(new Set([...selectedEntityIds, entity._id]));
    setSelectedEntityMap((prev) => ({ ...prev, [entity._id]: entity }));
    setFilterDummy((prev) => ({ ...prev, e: merged.join(",") }));
  };

  const removeEntityFromFilter = (entityId: string) => {
    const next = selectedEntityIds.filter((id) => id !== entityId);
    setSelectedEntityMap((prev) => {
      const clone = { ...prev };
      delete clone[entityId];
      return clone;
    });
    setFilterDummy((prev) => ({ ...prev, e: next.join(",") }));
  };

  const selectEmployeeCompanyFilter = (company: TCompanyOption) => {
    setFilterDummy((prev) => ({ ...prev, ec: company._id, e: "" }));
    setSelectedEmployeeCompany(company);
    setSelectedEntityMap({});
    setCompanySearchInput(company.name);
    setCompanySearchResults([]);
  };

  const renderBadge = (status: string | undefined, colorClass: string) => (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        colorClass,
      )}
    >
      {status}
    </span>
  );

  const incomeHref =
    embedded && lockEntityType && lockEntityId
      ? `/accounts/add-record?type=income&lockEntityType=${encodeURIComponent(lockEntityType)}&lockEntityId=${encodeURIComponent(lockEntityId)}&lockEntityName=${encodeURIComponent(lockEntityName || "")}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`
      : "/accounts/add-record?type=income";

  const expenseHref =
    embedded && lockEntityType && lockEntityId
      ? `/accounts/add-record?type=expense&lockEntityType=${encodeURIComponent(lockEntityType)}&lockEntityId=${encodeURIComponent(lockEntityId)}&lockEntityName=${encodeURIComponent(lockEntityName || "")}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`
      : "/accounts/add-record?type=expense";

  return (
    <>
      {type && !embedded && (
        <>
          <Breadcrumb
            pageName={`${recordsWithBalance[0]?.client?.name || type}'s Transactions`}
          />
          <div className="my-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <CardDataStats
              loading={isLoading}
              title="Total Transactions"
              total={`${cards[3]}`}
            >
              <FiInfo className="text-xl" />
            </CardDataStats>
            <CardDataStats
              loading={isLoading}
              title="Total Income"
              total={`${cards[1].toFixed(2)} AED`}
              color="emerald-500"
            >
              <FiArrowDownLeft className="text-xl text-emerald-500" />
            </CardDataStats>
            <CardDataStats
              loading={isLoading}
              title="Total Expense"
              total={`${cards[2].toFixed(2)} AED`}
              color="rose-500"
            >
              <FiArrowUpRight className="text-xl text-rose-500" />
            </CardDataStats>
            <CardDataStats
              loading={isLoading}
              title="Balance"
              total={`${cards[0].toFixed(2)} AED`}
            >
              <FiFilter className="text-xl text-emerald-500" />
            </CardDataStats>
          </div>
        </>
      )}

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none">
        {/* Filter Modal Overlay */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl max-h-[86vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:p-6">
              <button
                onClick={handleCancelFilter}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FiX className="text-xl" />
              </button>

              <h3 className="mb-1 text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FiFilter className="text-emerald-500" />
                Refine Transactions
              </h3>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                Keep only what you need on screen.
              </p>

              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Transaction Type
                  </label>
                  <select
                    value={filterDummy.t}
                    name="type"
                    onChange={(e) =>
                      setFilterDummy({ ...filterDummy, t: e.target.value })
                    }
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Payment Method
                  </label>
                  <select
                    value={filterDummy.m}
                    name="method"
                    onChange={(e) =>
                      setFilterDummy({ ...filterDummy, m: e.target.value })
                    }
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">All Methods</option>
                    {paymentMethodOptions.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Payment Status
                  </label>
                  <select
                    value={filterDummy.s}
                    name="status"
                    onChange={(e) =>
                      setFilterDummy({ ...filterDummy, s: e.target.value })
                    }
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">All Statuses</option>
                    {paymentStatusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Record Kind
                  </label>
                  <select
                    value={filterDummy.k}
                    name="recordKind"
                    onChange={(e) =>
                      setFilterDummy({ ...filterDummy, k: e.target.value })
                    }
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">All Kinds</option>
                    <option value="standard">Standard</option>
                    <option value="office_records">Office</option>
                    <option value="liability">Liability</option>
                    <option value="self_transfer">Self Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Office Category
                  </label>
                  <select
                    value={filterDummy.oc}
                    name="officeCategory"
                    onChange={(e) =>
                      setFilterDummy({ ...filterDummy, oc: e.target.value })
                    }
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">All Office Categories</option>
                    {officeCategoryOptions.map((officeCategory) => (
                      <option key={officeCategory.id} value={officeCategory.id}>
                        {officeCategory.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Filter by Entities
                </label>
                <input
                  value={entitySearchInput}
                  onChange={(event) => setEntitySearchInput(event.target.value)}
                  placeholder="Search company, employee, individual"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedEntityIds.map((entityId) => (
                    <button
                      key={entityId}
                      type="button"
                      onClick={() => removeEntityFromFilter(entityId)}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                    >
                      <EntityAvatar
                        name={selectedEntityMap[entityId]?.name || "Entity"}
                        color={selectedEntityMap[entityId]?.color}
                        size="sm"
                      />
                      <span className="max-w-[180px] truncate">
                        {selectedEntityMap[entityId]?.name || entityId.slice(-6)}
                      </span>
                      <FiX className="text-[11px]" />
                    </button>
                  ))}
                </div>
                {entitySearchLoading ? (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Searching entities...
                  </p>
                ) : entitySearchResults.length > 0 ? (
                  <div className="mt-3 max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                    {entitySearchResults.map((entity) => (
                      <button
                        key={entity._id}
                        type="button"
                        onClick={() => addEntityToFilter(entity)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <span className="flex items-center gap-2">
                          <EntityAvatar
                            name={entity.name}
                            color={entity.color}
                            size="sm"
                          />
                          <span className="font-medium">{entity.name}</span>
                        </span>
                        <span className="capitalize text-slate-500 dark:text-slate-400">
                          {entity.entityType}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Employees of Company
                </label>
                <input
                  value={companySearchInput}
                  onChange={(event) =>
                    setCompanySearchInput(event.target.value)
                  }
                  placeholder="Search company name"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                {filterDummy.ec && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-teal-300 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:border-teal-700/40 dark:bg-teal-900/20 dark:text-teal-300">
                      <EntityAvatar
                        name={selectedEmployeeCompany?.name || "Company"}
                        color={selectedEmployeeCompany?.color}
                        size="sm"
                      />
                      Employees of{" "}
                      {selectedEmployeeCompany?.name || "selected company"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterDummy((prev) => ({ ...prev, ec: "" }));
                        setSelectedEmployeeCompany(null);
                        setCompanySearchInput("");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-300"
                    >
                      <FiX className="text-[11px]" /> Clear
                    </button>
                  </div>
                )}
                {companySearchLoading ? (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Searching companies...
                  </p>
                ) : companySearchResults.length > 0 ? (
                  <div className="mt-3 max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                    {companySearchResults.map((company) => (
                      <button
                        key={company._id}
                        type="button"
                        onClick={() => selectEmployeeCompanyFilter(company)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <span className="flex items-center gap-2">
                          <EntityAvatar
                            name={company.name}
                            color={company.color}
                            size="sm"
                          />
                          <span className="font-medium">{company.name}</span>
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          Company
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="sticky bottom-0 mt-4 flex items-center justify-between border-t border-slate-200 bg-white/95 pt-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
                <button
                  onClick={() => {
                    setFilter(baseData);
                    setFilterDummy(baseData);
                    setEntitySearchInput("");
                    setCompanySearchInput("");
                    setSelectedEmployeeCompany(null);
                    setSelectedEntityMap({});
                    setFilterOpen(false);
                    setPageNumber(0);
                    setSelectedRecordIds([]);
                  }}
                  className="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors"
                >
                  Clear Filters
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelFilter}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFilter}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm shadow-emerald-600/30"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          className={clsx(
            "border-b border-slate-200/80 p-5 dark:border-slate-800 sm:p-6",
            "bg-white dark:bg-slate-900",
          )}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-200">
                  Transactions
                </p>
                {hasActiveFilter && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {filter.t && (
                      <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {filter.t}
                      </span>
                    )}
                    {filter.m && (
                      <PaymentMethodBadge
                        label={paymentMethodMap[filter.m]?.label || filter.m}
                        color={paymentMethodMap[filter.m]?.color}
                        icon={paymentMethodMap[filter.m]?.icon}
                        size="sm"
                        muted
                      />
                    )}
                    {filter.s && (
                      <span className="inline-flex items-center rounded-full border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:border-sky-700/40 dark:bg-sky-900/20 dark:text-sky-300">
                        {paymentStatusOptions.find(
                          (status) => status.value === filter.s,
                        )?.label || filter.s}
                      </span>
                    )}
                    {filter.k && (
                      <span className="inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-700/40 dark:bg-indigo-900/20 dark:text-indigo-300">
                        {filter.k.replace(/_/g, " ")}
                      </span>
                    )}
                    {filter.oc && (
                      <span className="inline-flex items-center rounded-full border border-fuchsia-300 bg-fuchsia-50 px-2.5 py-1 text-xs font-semibold text-fuchsia-700 dark:border-fuchsia-700/40 dark:bg-fuchsia-900/20 dark:text-fuchsia-300">
                        {officeCategoryOptions.find(
                          (officeCategory) => officeCategory.id === filter.oc,
                        )?.label || "Office Category"}
                      </span>
                    )}
                    {filter.e && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                        <EntityAvatar
                          name="Entities"
                          color="#10b981"
                          size="sm"
                        />
                        {(
                          filter.e.split(",").filter(Boolean).length || 0
                        ).toString()}{" "}
                        entities
                      </span>
                    )}
                    {filter.ec && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:border-teal-700/40 dark:bg-teal-900/20 dark:text-teal-300">
                        <EntityAvatar
                          name={selectedEmployeeCompany?.name || "Company"}
                          color={selectedEmployeeCompany?.color}
                          size="sm"
                        />
                        Employees of{" "}
                        {selectedEmployeeCompany?.name || "selected company"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Link
                  href={incomeHref}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white/90 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-white dark:border-emerald-700 dark:bg-slate-900/80 dark:text-emerald-300"
                >
                  <FiPlusCircle /> Income
                </Link>
                <Link
                  href={expenseHref}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white/90 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-white dark:border-rose-700 dark:bg-slate-900/80 dark:text-rose-300"
                >
                  <FiPlusCircle /> Expense
                </Link>
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <span>{visibleRecords.length} shown</span>
                  {selectedRecordIds.length > 0 && (
                    <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {selectedRecordIds.length} selected
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/60">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setPageNumber(0);
                  }}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="amount_desc">Amount: High-Low</option>
                  <option value="amount_asc">Amount: Low-High</option>
                </select>
                <select
                  value={String(pageSize)}
                  onChange={(event) => {
                    const nextSize = Number(event.target.value);
                    setPageSize(nextSize);
                    setPageNumber(0);
                  }}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="10">Show 10</option>
                  <option value="25">Show 25</option>
                  <option value="50">Show 50</option>
                  <option value="100">Show 100</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                <button
                  onClick={() => setExportScope("selected")}
                  className={clsx(
                    "rounded-md px-2 py-1 text-[11px] font-semibold",
                    exportScope === "selected"
                      ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700",
                  )}
                >
                  Sel
                </button>
                <button
                  onClick={() => setExportScope("page")}
                  className={clsx(
                    "rounded-md px-2 py-1 text-[11px] font-semibold",
                    exportScope === "page"
                      ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700",
                  )}
                >
                  Page
                </button>
                <button
                  onClick={() => setExportScope("all")}
                  className={clsx(
                    "rounded-md px-2 py-1 text-[11px] font-semibold",
                    exportScope === "all"
                      ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700",
                  )}
                >
                  All
                </button>
                <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />
                <button
                  onClick={() => setExportFormat("csv")}
                  className={clsx(
                    "rounded-md px-2 py-1 text-[11px] font-semibold",
                    exportFormat === "csv"
                      ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700",
                  )}
                >
                  CSV
                </button>
                <button
                  onClick={() => setExportFormat("excel")}
                  className={clsx(
                    "rounded-md px-2 py-1 text-[11px] font-semibold",
                    exportFormat === "excel"
                      ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700",
                  )}
                >
                  XLS
                </button>
                <button
                  onClick={() => setExportFormat("pdf")}
                  className={clsx(
                    "rounded-md px-2 py-1 text-[11px] font-semibold",
                    exportFormat === "pdf"
                      ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700",
                  )}
                >
                  PDF
                </button>
                <button
                  onClick={handleExport}
                  title="Export"
                  className="inline-flex items-center gap-1 rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-700/40 dark:bg-cyan-900/20 dark:text-cyan-300"
                >
                  <FiDownload />
                  <span>Export</span>
                </button>
                {isInnerEntityRecords && (
                  <button
                    onClick={handleConvertSelectedToInvoice}
                    className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 dark:border-violet-700/40 dark:bg-violet-900/20 dark:text-violet-300"
                  >
                    <FiFileText /> To Invoice
                  </button>
                )}
              </div>
              <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search transactions..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                />
              </div>
              <button
                onClick={() => setFilterOpen(true)}
                className={clsx(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                  hasActiveFilter
                    ? "border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                )}
              >
                <FiFilter /> Filters
                {activeFilterCount > 0 && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-bold text-white dark:bg-emerald-500">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-800/20">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                    {enableSelection && (
                      <th className="w-[48px] pb-3 pl-4">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={(event) =>
                            toggleSelectVisible(event.target.checked)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </th>
                    )}
                    <th className="min-w-[120px] pb-3 pl-4">Record ID</th>
                    <th className="min-w-[200px] px-4 pb-3">Client Details</th>
                    <th className="min-w-[150px] px-4 pb-3">Method</th>
                    <th className="min-w-[150px] px-4 pb-3">Amount</th>
                    <th className="min-w-[150px] px-4 pb-3">Date/Time</th>
                    {(type || category) && (
                      <th className="min-w-[120px] px-4 pb-3">Balance</th>
                    )}
                    <th className="px-4 pb-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={
                          type || category
                            ? enableSelection
                              ? 8
                              : 7
                            : enableSelection
                              ? 7
                              : 6
                        }
                        className="py-8"
                      >
                        <SkeletonList />
                      </td>
                    </tr>
                  ) : visibleRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          type || category
                            ? enableSelection
                              ? 8
                              : 7
                            : enableSelection
                              ? 7
                              : 6
                        }
                        className="py-12 text-center text-slate-500 dark:text-slate-400"
                      >
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    visibleRecords.map((record, key) =>
                      (() => {
                        const transactionVisual = getTransactionVisual(record);
                        const isLiabilityRecord =
                          record?.recordKind === "liability" ||
                          (record?.status || "")
                            .toLowerCase()
                            .includes("liability");

                        return (
                          <tr
                            key={key}
                            className="group border-b border-slate-100 transition-colors hover:bg-slate-50/70 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/50"
                          >
                            {enableSelection && (
                              <td className="py-4 pl-4 align-top">
                                <input
                                  type="checkbox"
                                  checked={selectedRecordIds.includes(
                                    record.id,
                                  )}
                                  onChange={(event) =>
                                    toggleRecordSelection(
                                      record.id,
                                      event.target.checked,
                                    )
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                              </td>
                            )}
                            <td className="py-4 pl-4 align-top">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-700 dark:text-slate-200 uppercase text-sm">
                                  {(record?.suffix || "") +
                                    (record?.number || "")}
                                </span>
                                {Number(record?.version || 0) > 0 && (
                                  <span className="inline-flex w-fit items-center text-xs font-medium text-orange-600 dark:text-orange-400">
                                    {getEditCountText(
                                      Number(record?.version || 0),
                                    )}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4 align-top">
                              <div className="flex items-start gap-3">
                                {getTransactionAvatar(record)}
                                <Link
                                  href={
                                    record?.client?.type &&
                                    record.client.type !== "self" &&
                                    record.client.type !== "office"
                                      ? `/${record.client.type}/${record.client.id}`
                                      : "#"
                                  }
                                  onClick={(event) => {
                                    if (
                                      !record?.client?.type ||
                                      record.client.type === "self" ||
                                      record.client.type === "office"
                                    ) {
                                      event.preventDefault();
                                    }
                                  }}
                                  className="group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                                >
                                  <p className="font-semibold text-sm text-slate-900 dark:text-white capitalize truncate">
                                    {record?.recordKind === "self_transfer"
                                      ? record?.type === "expense"
                                        ? "Self Transfer Out"
                                        : "Self Transfer In"
                                      : record?.recordKind === "office_records"
                                        ? record?.categoryName ||
                                          "Office Record"
                                        : record?.client?.name || "Unknown"}
                                  </p>
                                  <p className="text-xs font-medium text-cyan-500 dark:text-cyan-400">
                                    {record?.particular}
                                  </p>
                                </Link>
                              </div>
                            </td>

                            <td className="py-4 px-4 align-top">
                              <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                  {isLiabilityRecord ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/70 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-300">
                                      <FiInfo className="text-[11px]" />
                                      Liability Record
                                    </span>
                                  ) : (
                                    <PaymentMethodBadge
                                      label={
                                        paymentMethodMap[
                                          record?.paymentMethodTemplate || ""
                                        ]?.label ||
                                        record?.method ||
                                        "Unknown"
                                      }
                                      color={
                                        paymentMethodMap[
                                          record?.paymentMethodTemplate || ""
                                        ]?.color
                                      }
                                      icon={
                                        paymentMethodMap[
                                          record?.paymentMethodTemplate || ""
                                        ]?.icon
                                      }
                                      size="sm"
                                    />
                                  )}
                                </div>
                                {renderBadge(
                                  transactionVisual.label,
                                  transactionVisual.badgeClass,
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4 align-top">
                              <div className="flex flex-col items-start gap-1">
                                <span
                                  className={clsx(
                                    "font-bold",
                                    transactionVisual.amountClass,
                                  )}
                                >
                                  {record?.amount}{" "}
                                  <span className="text-xs font-medium">
                                    AED
                                  </span>
                                </span>
                                {record?.type === "expense" &&
                                  record?.serviceFee &&
                                  record.serviceFee != 0 && (
                                    <span
                                      className={clsx(
                                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                                      )}
                                    >
                                      <FiArrowDownLeft className="text-[11px] text-rose-500 dark:text-rose-400" />
                                      Fee {record.serviceFee}
                                    </span>
                                  )}
                              </div>
                            </td>

                            <td className="py-4 px-4 align-top text-sm text-slate-600 dark:text-slate-400">
                              <span
                                title={formatDateTime(
                                  record.createdAt || record.dateTime || null,
                                )}
                              >
                                {formatTransactionListDate(
                                  record.createdAt || record.dateTime || null,
                                )}
                              </span>
                            </td>

                            {(type || category) && (
                              <td className="py-4 px-4 align-top">
                                <span
                                  className={clsx(
                                    "font-semibold",
                                    (record.runningBalance || 0) >= 0
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-rose-600 dark:text-rose-400",
                                  )}
                                >
                                  {record.runningBalance?.toFixed(2)}{" "}
                                  <span className="text-xs font-medium">
                                    AED
                                  </span>
                                </span>
                              </td>
                            )}

                            <td className="py-4 pr-4 pl-2 align-top text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <Link
                                  title="Open Transaction Details"
                                  href={`/accounts/transactions/details/${record?.id}`}
                                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
                                >
                                  <FiArrowRight className="text-lg" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })(),
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination Container */}
        {!isLoading && (
          <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>
                  Page <span className="font-semibold text-slate-800 dark:text-slate-100">{pageNumber + 1}</span>
                </span>
                <span>•</span>
                <span>{visibleRecords.length} rows on this page</span>
              </div>
              <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pageNumber - 1)}
                disabled={pageNumber === 0 || isLoading}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
              >
                <FiChevronLeft /> Previous
              </button>
              <button
                onClick={() => handlePageChange(pageNumber + 1)}
                disabled={isLoading || !hasMore || !recordsWithBalance.length}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
              >
                Next <FiChevronRight />
              </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TransactionList;
