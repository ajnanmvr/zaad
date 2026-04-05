"use client";
import { TRecordList } from "@/types/records";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import ConfirmationModal from "../Modals/ConfirmationModal";
import { useEffect, useMemo, useState } from "react";
import SkeletonList from "../common/SkeletonList";
import CardDataStats from "../CardDataStats";
import Breadcrumb from "../Breadcrumbs/Breadcrumb";
import SelfDepositModal from "../Modals/SelfDepositModal";
import EntityAvatar from "../common/EntityAvatar";
import PaymentMethodBadge from "../common/PaymentMethodBadge";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { formatDateTime, formatRelativeDate } from "@/utils/dateUtils";
import { useUserContext } from "@/contexts/UserContext";
import { 
  FiFilter, 
  FiArrowUpRight, 
  FiArrowDownLeft, 
  FiPlus, 
  FiInfo, 
  FiTrash2, 
  FiEye,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiSearch
} from "react-icons/fi";

type TPaymentMethodOption = {
  value: string;
  label: string;
  color?: string;
  icon?: string;
};

const baseData = {
  t: "",
  m: "",
};

const generateQuery = (filter: typeof baseData) => {
  let query = "";
  if (filter.t) {
    query += `&t=${filter.t}`;
  }
  if (filter.m) {
    query += `&m=${filter.m}`;
  }
  return query;
};

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

const getTransactionVisual = (record: TRecordList) => {
  const status = (record?.status || "").toLowerCase();
  const particular = (record?.particular || "").toLowerCase();
  const isSelf = record?.client?.type === "self";

  const isSelfTransfer =
    status.includes("self deposit") ||
    particular.includes("money removed from") ||
    particular.includes("money recieved as exchange") ||
    particular.includes("money received as exchange");

  const isInstantProfit = status === "profit";
  const isLiability = record?.method === "liability" || status.includes("liability");
  const isOfficeExpense = status.includes("office expense") || particular.includes("office expense");
  const isCompanyExpense =
    isSelf &&
    record?.type === "expense" &&
    (isOfficeExpense || status.includes("debit"));

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
      label: "Company Expense",
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
  embedded = false,
  lockEntityType,
  lockEntityId,
  lockEntityName,
}: {
  type?: string | string[];
  id?: string | string[];
  embedded?: boolean;
  lockEntityType?: string;
  lockEntityId?: string;
  lockEntityName?: string;
}) => {
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const isAdmin = ["admin", "superadmin"].includes((user?.role || "").toLowerCase());

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isSecondConfirmationOpen, setIsSecondConfirmationOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [isSelfOpen, setSelfOpen] = useState(false);
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [filterDummy, setFilterDummy] = useState({ ...baseData });
  const [filter, setFilter] = useState({ ...baseData });
  const [hasMore, setHasMore] = useState(true);
  const [records, setRecords] = useState<TRecordList[]>([]);
  const [recordsWithBalance, setRecordsWithBalance] = useState<(TRecordList & { runningBalance?: number })[]>([]);
  const [cards, setCards] = useState([0, 0, 0, 0]);
  const [searchTerm, setSearchTerm] = useState("");

  const query = generateQuery(filter);
  const currentType = Array.isArray(type) ? type[0] : type;

  const { data: paymentData, isLoading } = useQuery({
    queryKey: ["payment", pageNumber, type, id, filter],
    queryFn: async () => {
      const routeSegment = currentType
        ? currentType === "self" || currentType === "self-deposit"
          ? `/${currentType}`
          : `/${currentType}/${id}`
        : "";
      const res = await axios.get(`/api/payment${routeSegment}?page=${pageNumber}${query}`);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const { data: paymentMethodOptions = [] } = useQuery<TPaymentMethodOption[]>({
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

  const paymentMethodMap = useMemo(() => {
    return paymentMethodOptions.reduce<Record<string, TPaymentMethodOption>>((acc, item) => {
      acc[item.value] = item;
      return acc;
    }, {});
  }, [paymentMethodOptions]);

  useEffect(() => {
    if (paymentData) {
      setRecords(paymentData.records);
      setHasMore(paymentData.hasMore);

      if (type && paymentData.records?.length > 0) {
        const { balance, totalIncome, totalExpense, totalTransactions } = paymentData;
        setCards([balance, totalIncome, totalExpense, totalTransactions]);

        const recordsWithRunningBalance = [...paymentData.records];
        let runningBalance = balance; 

        for (let i = 0; i < recordsWithRunningBalance.length; i++) {
          const record = recordsWithRunningBalance[i];
          recordsWithRunningBalance[i] = { ...record, runningBalance };

          const amount = parseFloat(record.amount) || 0;
          const serviceFee = parseFloat(record.serviceFee) || 0;

          if (record.type === "income" && record.method !== "liability") {
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
  }, [paymentData, type]);

  const visibleRecords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return recordsWithBalance;

    return recordsWithBalance.filter((record) => {
      const haystack = [
        `${record?.suffix || ""}${record?.number || ""}`,
        record?.client?.name || "",
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

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handleDelete = (id: string) => {
    setSelectedRecordId(id);
    setIsConfirmationOpen(true);
  };
  const confirmDelete = async () => {
    setIsConfirmationOpen(false);
    setIsSecondConfirmationOpen(true);
  };
  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      return axios.delete(`/api/payment/${id}`);
    },
    onMutate: () => {
      toast.loading("Deleting payment record...");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Record deleted successfully");
      setSelectedRecordId(null);
      setIsConfirmationOpen(false);
      setIsSecondConfirmationOpen(false);
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["profits"] });
    },
    onError: () => {
      toast.dismiss();
      toast.error("Failed to delete record");
    }
  });

  const secondConfirmDelete = async () => {
    if (!selectedRecordId) {
      setIsSecondConfirmationOpen(false);
      return;
    }
    deleteMutation.mutate(selectedRecordId);
    setIsSecondConfirmationOpen(false);
  };

  const cancelAction = () => {
    setSelectedRecordId(null);
    setIsConfirmationOpen(false);
    setIsSecondConfirmationOpen(false);
  };

  const handleFilter = () => {
    setFilter(filterDummy);
    setFilterOpen(false);
    setPageNumber(0);
  };
  
  const handleCancelFilter = () => {
    setFilterDummy({ ...filter });
    setFilterOpen(false);
  };

  const renderBadge = (status: string | undefined, colorClass: string) => (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", colorClass)}>
      {status}
    </span>
  );

  const incomeHref =
    embedded && lockEntityType && lockEntityId
      ? `/accounts/income?lockEntityType=${encodeURIComponent(lockEntityType)}&lockEntityId=${encodeURIComponent(lockEntityId)}&lockEntityName=${encodeURIComponent(lockEntityName || "")}`
      : "/accounts/income";

  const expenseHref =
    embedded && lockEntityType && lockEntityId
      ? `/accounts/expense?lockEntityType=${encodeURIComponent(lockEntityType)}&lockEntityId=${encodeURIComponent(lockEntityId)}&lockEntityName=${encodeURIComponent(lockEntityName || "")}`
      : "/accounts/expense";

  return (
    <>
      {type && !embedded && (
        <>
          <Breadcrumb pageName={`${recordsWithBalance[0]?.client?.name || type}'s Transactions`} />
          <div className="my-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <CardDataStats loading={isLoading} title="Total Transactions" total={`${cards[3]}`}>
              <FiInfo className="text-xl" />
            </CardDataStats>
            <CardDataStats loading={isLoading} title="Total Income" total={`${cards[1].toFixed(2)} AED`} color="emerald-500">
              <FiArrowDownLeft className="text-xl text-emerald-500" />
            </CardDataStats>
            <CardDataStats loading={isLoading} title="Total Expense" total={`${cards[2].toFixed(2)} AED`} color="rose-500">
              <FiArrowUpRight className="text-xl text-rose-500" />
            </CardDataStats>
            <CardDataStats loading={isLoading} title="Balance" total={`${cards[0].toFixed(2)} AED`}>
              <FiFilter className="text-xl text-emerald-500" />
            </CardDataStats>
          </div>
        </>
      )}

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none">
        
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          message="Are you sure you want to delete this payment record?"
          onConfirm={confirmDelete}
          onCancel={cancelAction}
        />
        <ConfirmationModal
          isOpen={isSecondConfirmationOpen}
          message="Are you really sure you want to delete this payment record? It will be moved to bin and can be recovered by admin."
          onConfirm={secondConfirmDelete}
          onCancel={cancelAction}
        />
        <SelfDepositModal
          isOpen={isSelfOpen}
          cancel={() => setSelfOpen(false)}
        />

        {/* Filter Modal Overlay */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 relative">
              <button onClick={handleCancelFilter} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
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
                    onChange={(e) => setFilterDummy({ ...filterDummy, t: e.target.value })}
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
                    onChange={(e) => setFilterDummy({ ...filterDummy, m: e.target.value })}
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
                <p className="text-base font-black tracking-tight text-slate-800 dark:text-slate-200">Transaction History</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {filter.m || filter.t ? `Filtered by: ${filter.t} ${filter.m}` : "All recent transactions"}
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

              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {visibleRecords.length} Records
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 p-3 dark:border-slate-700 dark:bg-slate-900/85">
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
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              <FiFilter /> Filter
            </button>
            <button
              onClick={() => setSelfOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
            >
              <FiArrowDownLeft /> Self Deposit
            </button>
            {currentType !== "self-deposit" && (
              <Link
                href="/accounts/transactions/self-deposit"
                className="flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 transition-colors hover:bg-cyan-100 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
              >
                <FiInfo /> Self Deposit Tracker
              </Link>
            )}
            <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
            <Link
              href={incomeHref}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 shadow-sm shadow-emerald-500/20"
            >
              <FiPlus /> Income
            </Link>
            <Link
              href={expenseHref}
              className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600 shadow-sm shadow-rose-500/20"
            >
              <FiPlus /> Expense
            </Link>
            {isAdmin && (
              <Link
                href="/accounts/transactions/bin"
                className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
              >
                <FiTrash2 /> Bin
              </Link>
            )}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-800/20">
          <div className="max-w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="min-w-[120px] pb-3 pl-4">Record ID</th>
                <th className="min-w-[200px] px-4 pb-3">Client Details</th>
                <th className="min-w-[150px] px-4 pb-3">Method</th>
                <th className="min-w-[150px] px-4 pb-3">Amount</th>
                <th className="min-w-[150px] px-4 pb-3">Date/Time</th>
                {type && <th className="min-w-[120px] px-4 pb-3">Balance</th>}
                <th className="px-4 pb-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                   <td colSpan={type ? 7 : 6} className="py-8">
                     <SkeletonList />
                   </td>
                </tr>
              ) : visibleRecords.length === 0 ? (
                <tr>
                  <td colSpan={type ? 7 : 6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                visibleRecords.map((record, key) => (
                  (() => {
                    const transactionVisual = getTransactionVisual(record);

                    return (
                      <tr 
                        key={key} 
                        className="group border-b border-slate-100 transition-colors hover:bg-slate-50/70 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/50"
                      >
                    <td className="py-4 pl-4 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 uppercase text-sm">
                           {(record?.suffix || "") + (record?.number || "")}
                        </span>
                        {record?.edited && (
                          <span className="inline-flex w-fit items-center rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600 ring-1 ring-inset ring-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400">
                            Edited
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-start gap-3">
                        <EntityAvatar name={record?.client?.name || "Unknown"} size="sm" />
                        <Link
                          href={`/${record?.client?.type !== "self" ? `${record?.client?.type}/${record?.client?.id}` : "accounts/transactions/self"}`}
                          className="group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                        >
                          <p className="font-semibold text-slate-900 dark:text-white capitalize truncate max-w-[200px]">
                            {record?.client?.name || "Unknown"}
                          </p>
                          <p className="text-xs font-medium text-emerald-500 dark:text-emerald-400 mt-1 truncate max-w-[200px]">
                            {record?.particular}
                          </p>
                        </Link>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <PaymentMethodBadge
                          label={paymentMethodMap[record?.method || ""]?.label || record?.method || "Unknown"}
                          color={paymentMethodMap[record?.method || ""]?.color}
                          icon={paymentMethodMap[record?.method || ""]?.icon}
                          size="sm"
                        />
                        {renderBadge(transactionVisual.label, transactionVisual.badgeClass)}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <span className={clsx(
                          "font-bold",
                          transactionVisual.amountClass
                        )}>
                          {record?.amount} <span className="text-xs font-medium">AED</span>
                        </span>
                        {record?.type === "expense" && record?.serviceFee && record.serviceFee != 0 && (
                          <span className={clsx("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400")}>
                            <FiArrowDownLeft className="text-[11px] text-rose-500 dark:text-rose-400" />
                            Fee {record.serviceFee}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top text-sm text-slate-600 dark:text-slate-400">
                      <span title={formatDateTime(record.createdAt || record.dateTime || null)}>
                        {formatTransactionListDate(record.createdAt || record.dateTime || null)}
                      </span>
                    </td>

                    {type && (
                      <td className="py-4 px-4 align-top">
                        <span className={clsx("font-semibold", (record.runningBalance || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                           {record.runningBalance?.toFixed(2)} <span className="text-xs font-medium">AED</span>
                        </span>
                      </td>
                    )}

                    <td className="py-4 pr-4 pl-2 align-top text-center">
                       <div className="flex items-center justify-center space-x-2">
                          {!type && !id && (
                            <Link
                              title="View Client Context"
                              href={`/accounts/transactions/${record?.client?.type !== "self" ? `${record?.client?.type}/${record?.client?.id}` : "self"}`}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-800/80 dark:hover:text-emerald-400"
                            >
                              <FiArrowUpRight className="text-lg" />
                            </Link>
                          )}
                          <Link
                            title="View Transaction Details"
                            href={`/accounts/transactions/details/${record?.id}`}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
                          >
                            <FiEye className="text-lg" />
                          </Link>
                          <button
                            title="Delete Record"
                            onClick={() => handleDelete(record?.id || "")}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                       </div>
                    </td>
                    </tr>
                    );
                  })()
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
      
      {/* Pagination Container */}
      {!isLoading && (
        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-800">
          <p className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
            Showing page <span className="font-semibold text-slate-800 dark:text-white">{pageNumber + 1}</span>
          </p>
          <div className="flex flex-1 justify-between sm:justify-end gap-3">
            <button
              onClick={() => handlePageChange(pageNumber - 1)}
              disabled={pageNumber === 0 || isLoading}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
            >
              <FiChevronLeft /> Previous
            </button>
            <button
              onClick={() => handlePageChange(pageNumber + 1)}
              disabled={isLoading || !hasMore || !recordsWithBalance.length}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
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
