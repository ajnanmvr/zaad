"use client";
import { TRecordList } from "@/types/records";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import ConfirmationModal from "../Modals/ConfirmationModal";
import { useEffect, useState } from "react";
import SkeletonList from "../common/SkeletonList";
import CardDataStats from "../CardDataStats";
import Breadcrumb from "../Breadcrumbs/Breadcrumb";
import SelfDepositModal from "../Modals/SelfDepositModal";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
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
  FiChevronRight
} from "react-icons/fi";

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

const TransactionList = ({
  type,
  id,
}: {
  type?: string | string[];
  id?: string | string[];
}) => {
  const queryClient = useQueryClient();

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<TRecordList | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isSecondConfirmationOpen, setIsSecondConfirmationOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSelfOpen, setSelfOpen] = useState(false);
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [filterDummy, setFilterDummy] = useState({ ...baseData });
  const [filter, setFilter] = useState({ ...baseData });
  const [hasMore, setHasMore] = useState(true);
  const [records, setRecords] = useState<TRecordList[]>([]);
  const [recordsWithBalance, setRecordsWithBalance] = useState<(TRecordList & { runningBalance?: number })[]>([]);
  const [cards, setCards] = useState([0, 0, 0, 0]);

  const query = generateQuery(filter);

  const { data: paymentData, isLoading } = useQuery({
    queryKey: ["payment", pageNumber, type, id, filter],
    queryFn: async () => {
      const res = await axios.get(`/api/payment${type ? ("/" + (type === "self" ? type : (type + "/" + id))) : ""}?page=${pageNumber + query}`);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

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

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handleDelete = (id: string) => {
    setSelectedRecordId(id);
    setIsConfirmationOpen(true);
  };
  const handleInfo = (record: TRecordList) => {
    setSelectedRecord(record);
    setIsInfoOpen(true);
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
    deleteMutation.mutate(selectedRecordId!);
    setIsSecondConfirmationOpen(false);
  };

  const cancelAction = () => {
    setSelectedRecordId(null);
    setIsConfirmationOpen(false);
    setIsSecondConfirmationOpen(false);
    setIsInfoOpen(false);
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

  return (
    <>
      {type && (
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-8">
        
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          message="Are you sure you want to delete this payment record?"
          onConfirm={confirmDelete}
          onCancel={cancelAction}
        />
        <ConfirmationModal
          isOpen={isSecondConfirmationOpen}
          message="Are you really sure you want to delete this payment record? This action cannot be undone."
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
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="tasdeed">Tasdeed</option>
                    <option value="swiper">Swiper</option>
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

        {/* View Details Info Modal Overlay */}
        {isInfoOpen && selectedRecord && (
          <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
             <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 relative">
                <button onClick={cancelAction} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <FiX className="text-xl" />
                </button>
                
                <h3 className="mb-6 text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FiInfo className="text-emerald-500" />
                  Payment Details
                </h3>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {selectedRecord.number && (
                      <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Transaction ID</span>
                        <span className="font-medium text-slate-900 dark:text-white uppercase">{selectedRecord.suffix + selectedRecord.number}</span>
                      </div>
                    )}
                    {selectedRecord.client && (
                      <>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Client Name</span>
                          <span className="font-medium text-slate-900 dark:text-white capitalize">{selectedRecord.client.name}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Client Type</span>
                          <span className="font-medium text-slate-900 dark:text-white capitalize">{selectedRecord.client.type}</span>
                        </div>
                      </>
                    )}
                    {selectedRecord.particular && (
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Particular</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400 capitalize">{selectedRecord.particular}</span>
                      </div>
                    )}
                    {selectedRecord.type && (
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Type</span>
                        {renderBadge(selectedRecord.type, selectedRecord.type === "income" ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20" : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20")}
                      </div>
                    )}
                    {selectedRecord.method && (
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Method</span>
                        <span className="font-medium text-slate-900 dark:text-white capitalize">{selectedRecord.method}</span>
                      </div>
                    )}
                    {selectedRecord.date && (
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Date</span>
                        <span className="font-medium text-slate-900 dark:text-white">{selectedRecord.date}</span>
                      </div>
                    )}
                    {selectedRecord.status && (
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                        {renderBadge(selectedRecord.status, "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700")}
                      </div>
                    )}
                    {selectedRecord.creator && (
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Creator</span>
                        <span className="font-medium text-slate-900 dark:text-white capitalize">{selectedRecord.creator}</span>
                      </div>
                    )}
                    {selectedRecord.amount && (
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Amount</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedRecord.amount} AED</span>
                      </div>
                    )}
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  <Link
                    href={`/${selectedRecord?.client?.type}/${selectedRecord?.client?.id}`}
                    className="flex justify-center items-center rounded-xl bg-slate-100 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    View Client
                  </Link>
                  <Link
                    href={`/accounts/transactions/edit/${selectedRecord?.type}/${selectedRecord.id}`}
                    className="flex justify-center items-center rounded-xl bg-emerald-50 px-4 py-2.5 font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                  >
                    Edit Record
                  </Link>
                </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-6 flex flex-col justify-between items-start gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Transaction History
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {filter.m || filter.t ? `Filtered by: ${filter.t} ${filter.m}` : "All recent transactions"}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
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
            <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block"></div>
            <Link
              href={"/accounts/income"}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 shadow-sm shadow-emerald-500/20"
            >
              <FiPlus /> Income
            </Link>
            <Link
              href={"/accounts/expense"}
              className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600 shadow-sm shadow-rose-500/20"
            >
              <FiPlus /> Expense
            </Link>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-sm font-semibold tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="py-4 pl-4 min-w-[120px]">Record ID</th>
                <th className="py-4 px-4 min-w-[200px]">Client Details</th>
                <th className="py-4 px-4 min-w-[150px]">Method</th>
                <th className="py-4 px-4 min-w-[150px]">Amount</th>
                <th className="py-4 px-4 min-w-[150px]">Date/Time</th>
                {type && <th className="py-4 px-4 min-w-[120px]">Balance</th>}
                <th className="py-4 pr-4 pl-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                   <td colSpan={type ? 7 : 6} className="py-8">
                     <SkeletonList />
                   </td>
                </tr>
              ) : recordsWithBalance.length === 0 ? (
                <tr>
                  <td colSpan={type ? 7 : 6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                recordsWithBalance.map((record, key) => (
                  <tr 
                    key={key} 
                    className="group border-b border-slate-100 transition-colors hover:bg-slate-50/50 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/50"
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
                    </td>

                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300 capitalize text-sm">
                          {record?.method}
                        </span>
                        {record?.status && renderBadge(record.status, "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700")}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <span className={clsx(
                          "font-bold",
                          record?.type === "expense" ? "text-rose-600 dark:text-rose-400" : record.method === "liability" ? "text-orange-500 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"
                        )}>
                          {record?.amount} <span className="text-xs font-medium">AED</span>
                        </span>
                        {record?.type === "expense" && record?.serviceFee && record.serviceFee != 0 && (
                          <span className={clsx("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400")}>
                            Fee +{record.serviceFee}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top text-sm text-slate-600 dark:text-slate-400">
                      {record.date}
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
                          <button
                            title="View Transaction Details"
                            onClick={() => handleInfo(record)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
                          >
                            <FiEye className="text-lg" />
                          </button>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination Container */}
      {!isLoading && recordsWithBalance.length > 0 && (
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
    </>
  );
};

export default TransactionList;
