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
import { exportRowsCsv, exportRowsExcel, exportRowsPdf } from "@/utils/exportTableData";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
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

type ExportScope = "selected" | "all";
type ExportFormat = "csv" | "excel" | "pdf";

const baseData = {
  t: "",
  m: "",
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
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [exportScope, setExportScope] = useState<ExportScope>("selected");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");

  const currentType = Array.isArray(type) ? type[0] : type;
  const hasLedgerContext = Boolean(currentType || category);

  const { data: paymentData, isLoading } = useQuery({
    queryKey: ["payment", pageNumber, type, id, category, filter],
    queryFn: async () => {
      const routeSegment = currentType
        ? currentType === "self" || currentType === "self-deposit"
          ? `/${currentType}`
          : `/${currentType}/${id}`
        : "";
      const params = new URLSearchParams();
      params.set("page", String(pageNumber));
      if (filter.t) params.set("t", filter.t);
      if (filter.m) params.set("m", filter.m);
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
        record?.client?.name || (record?.recordKind === "office_records" ? record?.categoryName || "" : ""),
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

  const toggleSelectVisible = (checked: boolean) => {
    if (!checked) {
      const visibleIds = new Set(visibleRecords.map((record) => record.id));
      setSelectedRecordIds((prev) => prev.filter((id) => !visibleIds.has(id)));
      return;
    }

    const visibleIds = visibleRecords.map((record) => record.id);
    setSelectedRecordIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
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

  const mapRecordsForExport = (rows: (TRecordList & { runningBalance?: number })[]) =>
    rows.map((record) => {
      const amount = Number(record.amount || 0);
      const serviceFee = Number(record.serviceFee || 0);
      return {
        "Record ID": `${record.suffix || ""}${record.number || ""}`,
        Client: record.recordKind === "office_records" ? record.categoryName || "Office Record" : record.client?.name || "",
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
    const sourceRows = exportScope === "selected" ? selectedRecords : visibleRecords;

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
        if (record.client?.type === "employee" || record.client?.type === "individual") {
          descriptionParts.push(`Employee: ${record.client?.name || "Unknown"}`);
        } else {
          descriptionParts.push(`Company: ${record.client?.name || "Unknown"}`);
          if (record.employeeName) {
            descriptionParts.push(`Employee: ${record.employeeName}`);
          }
        }
        descriptionParts.push(record.method || "Unknown method");

        return {
          title: record.particular || `Expense ${record.suffix || ""}${record.number || ""}`,
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
              name: lockEntityName || selectedRecords[0]?.client?.name || "Client",
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
      sessionStorage.setItem(INVOICE_PREFILL_STORAGE_KEY, JSON.stringify(prefillPayload));
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
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 relative">
              <button
                onClick={handleCancelFilter}
                className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FiX className="text-xl" />
              </button>

              <h3 className="mb-6 text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FiFilter className="text-emerald-500" />
                Filter Transactions
              </h3>

              <div className="mb-6 flex flex-col gap-6 sm:flex-row">
                <div className="w-full sm:w-1/2">
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
                <div className="w-full sm:w-1/2">
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

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => {
                    setFilter(baseData);
                    setFilterDummy(baseData);
                    setFilterOpen(false);
                    setPageNumber(0);
                  }}
                  className="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors"
                >
                  Clear Filters
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelFilter}
                    className="rounded-xl bg-slate-100 px-6 py-2.5 font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFilter}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 font-medium text-white transition hover:bg-emerald-700 shadow-sm shadow-emerald-600/30"
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
            "border-b border-slate-200/80 p-6 dark:border-slate-800 sm:p-7",
            embedded
              ? "bg-white dark:bg-slate-900"
              : "relative overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900",
          )}
        >
          {!embedded && (
            <>
              <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-cyan-200/40 blur-2xl dark:bg-cyan-500/10" />
              <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-emerald-200/50 blur-xl dark:bg-emerald-500/10" />
            </>
          )}

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-base font-black tracking-tight text-slate-800 dark:text-slate-200">
                  Transaction History
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {filter.m || filter.t
                    ? `Filtered by: ${filter.t} ${filter.m}`
                    : "All recent transactions"}
                </p>
                {(filter.m || filter.t) && (
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
                <div className="inline-flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  {visibleRecords.length} Records
                  {isInnerEntityRecords && selectedRecordIds.length > 0
                    ? ` • ${selectedRecordIds.length} selected`
                    : ""}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 p-3 dark:border-slate-700 dark:bg-slate-900/85">
              {isInnerEntityRecords && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-700 dark:bg-slate-800">
                  <select
                    value={exportScope}
                    onChange={(event) => setExportScope(event.target.value as ExportScope)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="selected">Export selected</option>
                    <option value="all">Export all (visible)</option>
                  </select>
                  <select
                    value={exportFormat}
                    onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="csv">CSV</option>
                    <option value="excel">Excel</option>
                    <option value="pdf">PDF</option>
                  </select>
                  <button
                    onClick={handleExport}
                    className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-700/40 dark:bg-cyan-900/20 dark:text-cyan-300"
                  >
                    <FiDownload /> Export
                  </button>
                  <button
                    onClick={handleConvertSelectedToInvoice}
                    className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 dark:border-violet-700/40 dark:bg-violet-900/20 dark:text-violet-300"
                  >
                    <FiFileText /> To Invoice
                  </button>
                </div>
              )}
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
                  "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                  filter.m || filter.t
                    ? "border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                )}
              >
                <FiFilter /> Filter
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
                    {isInnerEntityRecords && (
                      <th className="w-[48px] pb-3 pl-4">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={(event) => toggleSelectVisible(event.target.checked)}
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
                      <td colSpan={(type || category) ? (isInnerEntityRecords ? 8 : 7) : isInnerEntityRecords ? 7 : 6} className="py-8">
                        <SkeletonList />
                      </td>
                    </tr>
                  ) : visibleRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan={(type || category) ? (isInnerEntityRecords ? 8 : 7) : isInnerEntityRecords ? 7 : 6}
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
                          (record?.status || "").toLowerCase().includes("liability");

                        return (
                          <tr
                            key={key}
                            className="group border-b border-slate-100 transition-colors hover:bg-slate-50/70 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/50"
                          >
                            {isInnerEntityRecords && (
                              <td className="py-4 pl-4 align-top">
                                <input
                                  type="checkbox"
                                  checked={selectedRecordIds.includes(record.id)}
                                  onChange={(event) =>
                                    toggleRecordSelection(record.id, event.target.checked)
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                              </td>
                            )}
                            <td className="py-4 pl-4 align-top">
                              <div className="flex flex-col gap-1">
                                <span className="font-semibold text-slate-700 dark:text-slate-200 uppercase text-sm">
                                  {(record?.suffix || "") +
                                    (record?.number || "")}
                                </span>
                                {Number(record?.version || 0) > 0 && (
                                  <span className="inline-flex w-fit items-center rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600 ring-1 ring-inset ring-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400">
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
                                  <p className="font-semibold text-slate-900 dark:text-white capitalize truncate max-w-[200px]">
                                    {record?.recordKind === "self_transfer"
                                      ? record?.type === "expense"
                                        ? "Self Transfer Out"
                                        : "Self Transfer In"
                                      : record?.recordKind === "office_records"
                                      ? record?.categoryName || "Office Record"
                                      : record?.client?.name || "Unknown"}
                                  </p>
                                  <p className="text-xs font-medium text-emerald-500 dark:text-emerald-400 mt-1 truncate max-w-[200px]">
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
                                        paymentMethodMap[record?.paymentMethodTemplate || ""]
                                          ?.label ||
                                        record?.method ||
                                        "Unknown"
                                      }
                                      color={
                                        paymentMethodMap[record?.paymentMethodTemplate || ""]
                                          ?.color
                                      }
                                      icon={
                                        paymentMethodMap[record?.paymentMethodTemplate || ""]
                                          ?.icon
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
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 px-2 pt-6 dark:border-slate-800">
            <p className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
              Showing page{" "}
              <span className="font-semibold text-slate-800 dark:text-white">
                {pageNumber + 1}
              </span>
            </p>
            <div className="flex flex-1 justify-between sm:justify-end gap-3">
              <button
                onClick={() => handlePageChange(pageNumber - 1)}
                disabled={pageNumber === 0 || isLoading}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
              >
                <FiChevronLeft /> Previous
              </button>
              <button
                onClick={() => handlePageChange(pageNumber + 1)}
                disabled={isLoading || !hasMore || !recordsWithBalance.length}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TransactionList;
