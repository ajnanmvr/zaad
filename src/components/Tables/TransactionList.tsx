"use client";
import { useUserContext } from "@/contexts/UserContext";
import { TRecordList } from "@/types/records";
import { formatDateTime, formatRelativeDate } from "@/utils/dateUtils";
import {
  exportRowsCsv,
  exportRowsExcel,
  exportRowsPdf,
} from "@/utils/exportTableData";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiArrowDownLeft,
  FiArrowRight,
  FiArrowUpRight,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiFilter,
  FiInfo,
  FiMenu,
  FiPlusCircle,
  FiSearch,
  FiX
} from "react-icons/fi";
import Breadcrumb from "../Breadcrumbs/Breadcrumb";
import CardDataStats from "../CardDataStats";
import EntityAvatar from "../common/EntityAvatar";
import ExportActionsMenu from "../common/ExportActionsMenu";
import PaymentMethodBadge from "../common/PaymentMethodBadge";
import SkeletonList from "../common/SkeletonList";

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

type TOfficeCategoryOption = {
  id: string;
  label: string;
};

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

const isLiabilityRecord = (record: TRecordList) =>
  String(record?.recordKind || "").toLowerCase() === "liability" ||
  String(record?.status || "")
    .toLowerCase()
    .includes("liability");

const summarizeTransactionRecords = (
  records: TRecordList[],
  excludeLiabilities = false,
) =>
  records.reduce(
    (summary, record) => {
      if (excludeLiabilities && isLiabilityRecord(record)) {
        return summary;
      }

      const amount = Number(record?.amount || 0);
      const serviceFee = Number(record?.serviceFee || 0);

      if (record?.type === "income" && !isLiabilityRecord(record)) {
        summary.totalIncome += amount;
      } else if (record?.type === "expense") {
        summary.totalExpense += amount;
        summary.totalServiceFee += serviceFee;
      }

      summary.totalTransactions += 1;
      summary.balance =
        summary.totalIncome - (summary.totalExpense + summary.totalServiceFee);
      return summary;
    },
    {
      totalIncome: 0,
      totalExpense: 0,
      totalServiceFee: 0,
      totalTransactions: 0,
      balance: 0,
    },
  );

const TransactionList = ({
  type,
  id,
  category,
  embedded = false,
  enableSelection = false,
  lockEntityType,
  lockEntityId,
  lockEntityName,
  returnTo,
}: {
  type?: string | string[];
  id?: string | string[];
  category?: LedgerCategory;
  embedded?: boolean;
  enableSelection?: boolean;
  lockEntityType?: string;
  lockEntityId?: string;
  lockEntityName?: string;
  returnTo?: string;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { user } = useUserContext();
  const normalizedRole = (user?.role || "").toLowerCase().replace(/[\s_-]+/g, "");
  const isAdmin = ["admin", "superadmin"].includes(normalizedRole);

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
  const [isSortOpen, setSortOpen] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [entityRecordsType, setEntityRecordsType] = useState<
    "company" | "employees" | "both"
  >("company");

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
      entityRecordsType,
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
      if (companyRecordScope) {
        params.set("recordScope", companyRecordScope);
      }
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

  const paymentMethodMap = useMemo(() => {
    return paymentMethodOptions.reduce<Record<string, TPaymentMethodOption>>(
      (acc, item) => {
        acc[item.value] = item;
        return acc;
      },
      {},
    );
  }, [paymentMethodOptions]);

  const isInnerEntityRecords =
    embedded && Boolean(lockEntityType) && Boolean(lockEntityId);

  const companyRecordScope = useMemo(() => {
    if (!isInnerEntityRecords || lockEntityType !== "company") {
      return null;
    }

    if (entityRecordsType === "employees") {
      return "employees";
    }

    if (entityRecordsType === "both") {
      return "mixed";
    }

    return "company";
  }, [entityRecordsType, isInnerEntityRecords, lockEntityType]);

  useEffect(() => {
    if (paymentData) {
      const nextRecords = isInnerEntityRecords
        ? (paymentData.records || []).filter(
            (record: TRecordList) => !isLiabilityRecord(record),
          )
        : paymentData.records || [];

      setRecords(nextRecords);
      setHasMore(paymentData.hasMore);

      if (hasLedgerContext) {
        const fallbackTotals = summarizeTransactionRecords(
          nextRecords,
          isInnerEntityRecords,
        );
        const totalIncome = Number(paymentData?.totalIncome);
        const totalExpense = Number(paymentData?.totalExpense);
        const totalTransactions = Number(paymentData?.totalTransactions);
        const balance = Number(paymentData?.balance);

        const nextTotalIncome = Number.isFinite(totalIncome)
          ? totalIncome
          : fallbackTotals.totalIncome;
        const nextTotalExpense = Number.isFinite(totalExpense)
          ? totalExpense
          : fallbackTotals.totalExpense;
        const nextTotalTransactions = Number.isFinite(totalTransactions)
          ? totalTransactions
          : fallbackTotals.totalTransactions;
        const nextBalance = Number.isFinite(balance)
          ? balance
          : fallbackTotals.balance;

        setCards([
          nextBalance,
          nextTotalIncome,
          nextTotalExpense,
          nextTotalTransactions,
        ]);

        const recordsWithRunningBalance = [...nextRecords];
        let runningBalance = nextBalance;

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
        setRecordsWithBalance(nextRecords);
      }
    }
  }, [hasLedgerContext, isInnerEntityRecords, paymentData]);

  const visibleRecords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const recordsToSearch = isInnerEntityRecords
      ? recordsWithBalance.filter((record) => !isLiabilityRecord(record))
      : recordsWithBalance;

    if (!normalizedSearch) return recordsToSearch;

    return recordsToSearch.filter((record) => {
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
  }, [isInnerEntityRecords, recordsWithBalance, searchTerm]);

  const entitySummary = useMemo(
    () => summarizeTransactionRecords(visibleRecords, true),
    [visibleRecords],
  );

  const precomputedEntitySummary = useMemo(() => {
    if (!isInnerEntityRecords) {
      return null;
    }

    const totalIncome = Number(paymentData?.totalIncome);
    const totalExpense = Number(paymentData?.totalExpense);
    const totalServiceFee = Number(paymentData?.totalServiceFee || 0);
    const totalTransactions = Number(paymentData?.totalTransactions);
    const balance = Number(paymentData?.balance);

    if (
      !Number.isFinite(totalIncome) ||
      !Number.isFinite(totalExpense) ||
      !Number.isFinite(totalTransactions) ||
      !Number.isFinite(balance)
    ) {
      return null;
    }

    return {
      totalIncome,
      totalExpense,
      totalServiceFee,
      totalTransactions,
      balance,
    };
  }, [
    isInnerEntityRecords,
    paymentData?.balance,
    paymentData?.totalExpense,
    paymentData?.totalServiceFee,
    paymentData?.totalIncome,
    paymentData?.totalTransactions,
  ]);

  const displayEntitySummary = precomputedEntitySummary || entitySummary;

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

  const handleExport = async (
    format: "csv" | "excel" | "pdf",
    mode: "selected" | "all",
  ) => {
    let sourceRows: (TRecordList & { runningBalance?: number })[] = [];

    if (mode === "selected") {
      sourceRows = selectedRecords;
    } else if (mode === "all") {
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
        if (companyRecordScope) {
          params.set("recordScope", companyRecordScope);
        }

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
        mode === "selected"
          ? "Select records to export"
          : "No records available to export",
      );
      return;
    }

    const rows = mapRecordsForExport(sourceRows);
    const filePrefix = `${lockEntityName || currentType || "records"}-records`;

    if (format === "csv") {
      exportRowsCsv(rows, filePrefix);
      toast.success("CSV exported");
      return;
    }

    if (format === "excel") {
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

    const isCompanyGeneratedInvoice = lockEntityType === "company";

    const expenseItems = selectedRecords
      .filter((record) => record.type === "expense")
      .map((record) => {
        const amount = Number(record.amount || 0);
        const serviceFee = Number(record.serviceFee || 0);
        const total = amount + serviceFee;

        const description =
          isCompanyGeneratedInvoice && record.client?.type === "employee"
            ? `Employee: ${record.client?.name || record.employeeName || "Unknown"}`
            : "";

        return {
          title:
            record.particular ||
            `Expense ${record.suffix || ""}${record.number || ""}`,
          desc: description,
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

  const entityBalance = Number(displayEntitySummary.balance || 0);
  const entityBalanceLabel = `${Math.abs(entityBalance).toFixed(2)} AED`;

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

      {isInnerEntityRecords && (
        <div className="my-6 space-y-3">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Transactions
              </p>
              <p className="mt-1 text-base font-black text-slate-900 dark:text-slate-100">
                {isLoading ? "..." : displayEntitySummary.totalTransactions}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Income
              </p>
              <p className="mt-1 text-base font-black text-slate-900 dark:text-slate-100">
                {isLoading
                  ? "..."
                  : `${displayEntitySummary.totalIncome.toFixed(2)} AED`}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Expense
              </p>
              <p className="mt-1 text-base font-black text-slate-900 dark:text-slate-100">
                {isLoading
                  ? "..."
                  : `${(displayEntitySummary.totalExpense + displayEntitySummary.totalServiceFee).toFixed(2)} AED`}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Balance
              </p>
              <p
                className={clsx(
                  "mt-1 text-base font-black",
                  entityBalance < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {isLoading ? "..." : entityBalanceLabel}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none">
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
                        <EntityAvatar name="Company" size="sm" />
                        Company employees
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {isInnerEntityRecords && lockEntityType === "company" && (
                  <select
                    value={entityRecordsType}
                    onChange={(e) => {
                      setEntityRecordsType(
                        e.target.value as "company" | "employees" | "both",
                      );
                      setPageNumber(0);
                    }}
                    className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="company">Company records only</option>
                    <option value="employees">Employees only</option>
                    <option value="both">Company & Employees</option>
                  </select>
                )}
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
                {isInnerEntityRecords && (
                  <button
                    type="button"
                    onClick={handleConvertSelectedToInvoice}
                    disabled={selectedRecordIds.length === 0}
                    className={clsx(
                      "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition",
                      selectedRecordIds.length > 0
                        ? "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-700/40 dark:bg-violet-900/20 dark:text-violet-300"
                        : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500",
                    )}
                  >
                    <FiFileText /> To Invoice
                  </button>
                )}
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
              <div className="relative min-w-[240px] flex-1 order-1">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search transactions..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                />
              </div>

              <div className="relative order-2">
                <button
                  type="button"
                  onClick={() => setSortOpen((prev) => !prev)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  title="Sort options"
                >
                  <FiChevronDown
                    className={clsx(
                      "transition-transform",
                      isSortOpen && "rotate-180",
                    )}
                  />
                </button>

                {isSortOpen && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("newest");
                        setPageNumber(0);
                        setSortOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Newest
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("oldest");
                        setPageNumber(0);
                        setSortOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Oldest
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("amount_desc");
                        setPageNumber(0);
                        setSortOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Amount High-Low
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("amount_asc");
                        setPageNumber(0);
                        setSortOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Amount Low-High
                    </button>
                  </div>
                )}
              </div>

              <ExportActionsMenu
                iconOnly
                className="order-3"
                onExport={handleExport}
                selectedCount={selectedRecordIds.length}
              />

              <button
                onClick={() => setFilterOpen(true)}
                className={clsx(
                  "order-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                  hasActiveFilter
                    ? "border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                )}
                title="Open filters and options"
              >
                <FiMenu />
                {activeFilterCount > 0 && (
                  <span className="absolute mt-[-22px] ml-[22px] inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-bold text-white dark:bg-emerald-500">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Inline Filter Strip */}
        {isFilterOpen && (
          <div className="border-b border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-5">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {!isInnerEntityRecords && (
                  <select
                    value={String(pageSize)}
                    onChange={(event) => {
                      const nextSize = Number(event.target.value);
                      setPageSize(nextSize);
                      setPageNumber(0);
                    }}
                    className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="10">10 rows</option>
                    <option value="25">25 rows</option>
                    <option value="50">50 rows</option>
                    <option value="100">100 rows</option>
                  </select>
                )}

                <select
                  value={filterDummy.t}
                  onChange={(e) =>
                    setFilterDummy({ ...filterDummy, t: e.target.value })
                  }
                  className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">All types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>

                <select
                  value={filterDummy.m}
                  onChange={(e) =>
                    setFilterDummy({ ...filterDummy, m: e.target.value })
                  }
                  className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">All methods</option>
                  {paymentMethodOptions.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filterDummy.s}
                  onChange={(e) =>
                    setFilterDummy({ ...filterDummy, s: e.target.value })
                  }
                  className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">All statuses</option>
                  {paymentStatusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>

                {!isInnerEntityRecords && (
                  <select
                    value={filterDummy.k}
                    onChange={(e) =>
                      setFilterDummy({ ...filterDummy, k: e.target.value })
                    }
                    className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">All kinds</option>
                    <option value="standard">Standard</option>
                    <option value="office_records">Office</option>
                    <option value="liability">Liability</option>
                    <option value="self_transfer">Self Transfer</option>
                  </select>
                )}

                {!isInnerEntityRecords && (
                  <select
                    value={filterDummy.oc}
                    onChange={(e) =>
                      setFilterDummy({ ...filterDummy, oc: e.target.value })
                    }
                    className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Office category</option>
                    {officeCategoryOptions.map((officeCategory) => (
                      <option key={officeCategory.id} value={officeCategory.id}>
                        {officeCategory.label}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={handleCancelFilter}
                  className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-slate-100 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleFilter}
                  className="inline-flex h-9 items-center rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700"
                >
                  Apply
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFilter(baseData);
                    setFilterDummy(baseData);
                    setFilterOpen(false);
                    setPageNumber(0);
                    setSelectedRecordIds([]);
                  }}
                  className="inline-flex h-9 items-center rounded-lg border border-rose-300 px-3 text-sm font-medium text-rose-500 transition hover:bg-rose-50 dark:border-rose-700 dark:hover:bg-rose-900/20"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={handleCancelFilter}
                  className="ml-auto inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Close filters"
                >
                  <FiX />
                </button>
              </div>
            </div>
          </div>
        )}

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
                            className={clsx(
                              "group border-b border-slate-100 transition-colors last:border-0 dark:border-slate-800",
                              key % 2 === 0
                                ? "bg-white dark:bg-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-800/50"
                                : "bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-200  dark:hover:bg-slate-800/50",
                            )}
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

                            <td className="py-4 px-4 align-top uppercase">
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
                                  <p className="font-semibold text-sm text-slate-900 dark:text-white truncate max-w-60">
                                    {record?.recordKind === "self_transfer"
                                      ? record?.type === "expense"
                                        ? "Self Transfer Out"
                                        : "Self Transfer In"
                                      : record?.recordKind === "office_records"
                                        ? record?.categoryName ||
                                          "Office Record"
                                        : record?.client?.name || "Unknown"}
                                  </p>
                                  <p className="text-xs font-medium text-cyan-500 dark:text-cyan-400 max-w-60">
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
                  Page{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {pageNumber + 1}
                  </span>
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
