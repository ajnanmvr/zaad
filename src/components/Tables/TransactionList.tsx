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
  const [selectedRecord, setSelectedRecord] = useState<TRecordList | null>(
    null
  );
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isSecondConfirmationOpen, setIsSecondConfirmationOpen] =
    useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSelfOpen, setSelfOpen] = useState(false);
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [filterDummy, setFilterDummy] = useState({ ...baseData });
  const [filter, setFilter] = useState({ ...baseData });
  const [hasMore, setHasMore] = useState(true);
  const [records, setRecords] = useState<TRecordList[]>([]);
  const [cards, setCards] = useState([0, 0, 0, 0]);


  const query = generateQuery(filter)

  const { data: paymentData, isLoading } = useQuery({
    queryKey: ["payment", pageNumber, type, id, filter],
    queryFn: async () => {
      const res = await axios.get(`/api/payment${type ? ("/" + (type === "self" ? type : (type + "/" + id))) : ""}?page=${pageNumber + query}`)
      return res.data;
    },
    placeholderData: keepPreviousData,

  })

  console.log(paymentData);

  useEffect(() => {
    if (paymentData) {
      setRecords(paymentData.records);
      setHasMore(paymentData.hasMore);
      if (type) {
        const { balance, totalIncome, totalExpense, totalTransactions } =
          paymentData;
        setCards([balance, totalIncome, totalExpense, totalTransactions])
      }
    }
  }, [paymentData]);


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
  };
  const handleCancelFilter = () => {
    setFilterDummy({ ...filter });
    setFilterOpen(false);
  };

  return (
    <>
      {type && (
        <>
          <Breadcrumb
            pageName={`${records[0]?.client?.name || type}'s transactions`}
          />
          <div className="my-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
            <CardDataStats loading={isLoading} title="Total Transactions" total={`${cards[3]}`} />
            <CardDataStats
              loading={isLoading}
              title="Total Income"
              total={`${cards[1].toFixed(2)} AED`}
              color="meta-3"
            />
            <CardDataStats
              loading={isLoading}
              title="Total Expense"
              total={`${cards[2].toFixed(2)} AED`}
              color="red"
            />
            <CardDataStats
              loading={isLoading}
              title="Balance"
              total={`${cards[0].toFixed(2)} AED`}
            />
          </div>
        </>
      )}
      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
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
        {isFilterOpen && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-999">
            <div className="bg-white dark:bg-black p-5 rounded-lg shadow-lg">
              <p className="text-center font-bold text-xl my-2 text-primary">
                Filter Transaction Data
              </p>
              <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Type
                  </label>
                  <div className="relative z-20 bg-transparent dark:bg-form-input">
                    <select
                      title="filter by transaction type"
                      value={filterDummy.t}
                      name="type"
                      onChange={(e) => {
                        setFilterDummy({ ...filterDummy, t: e.target.value });
                      }}
                      className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    >
                      <option value="" className="text-body dark:text-bodydark">
                        All
                      </option>
                      <option
                        value="income"
                        className="text-body dark:text-bodydark"
                      >
                        Income
                      </option>
                      <option
                        value="expense"
                        className="text-body dark:text-bodydark"
                      >
                        Expense
                      </option>
                    </select>

                    <span className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
                      <svg
                        className="fill-current"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g opacity="0.8">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                          ></path>
                        </g>
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Method
                  </label>
                  <div className="relative z-20 bg-transparent dark:bg-form-input">
                    <select
                      value={filterDummy.m}
                      title="filter by transaction method"
                      name="method"
                      onChange={(e) => {
                        setFilterDummy({ ...filterDummy, m: e.target.value });
                      }}
                      className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    >
                      <option value="" className="text-body dark:text-bodydark">
                        All
                      </option>
                      <option
                        value="cash"
                        className="text-body dark:text-bodydark"
                      >
                        Cash
                      </option>
                      <option
                        value="bank"
                        className="text-body dark:text-bodydark"
                      >
                        Bank
                      </option>
                      <option
                        value="tasdeed"
                        className="text-body dark:text-bodydark"
                      >
                        Tasdeed{" "}
                      </option>
                      <option
                        value="swiper"
                        className="text-body dark:text-bodydark"
                      >
                        Swiper{" "}
                      </option>
                    </select>

                    <span className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
                      <svg
                        className="fill-current"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g opacity="0.8">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                          ></path>
                        </g>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <div className="inline-flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFilter(baseData);
                      setFilterDummy(baseData);
                      setFilterOpen(false);
                    }}
                    className="text-red hover:bg-red hover:text-white px-2 py-1 rounded"
                  >
                    Clear Filter
                  </button>
                </div>
                <div>
                  <button
                    onClick={handleCancelFilter}
                    className="mr-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFilter}
                    className="px-4 py-2 bg-primary hover:bg-opacity-90 text-white rounded-lg"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {isInfoOpen && selectedRecord && (
          <div className="fixed z-999 inset-0 flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white capitalize dark:bg-black flex flex-col items-center justify-center p-5 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Payment Details</h2>

              <table className="table-auto w-full">
                <tbody>
                  {selectedRecord.number && (
                    <tr>
                      <th className="px-4 py-2 border">Transaction ID</th>
                      <td className="px-4 py-2 border">
                        {selectedRecord.suffix + selectedRecord.number}
                      </td>
                    </tr>
                  )}
                  {selectedRecord.client && (
                    <>
                      <tr>
                        <th className="px-4 py-2 border">Client Name</th>
                        <td className="px-4 py-2 border">
                          {selectedRecord.client.name}
                        </td>
                      </tr>
                      <tr>
                        <th className="px-4 py-2 border">Client Type</th>
                        <td className="px-4 py-2 border">
                          {selectedRecord.client?.type}
                        </td>
                      </tr>
                    </>
                  )}
                  {selectedRecord.particular && (
                    <tr>
                      <th className="px-4 py-2 border">Particular</th>
                      <td className="px-4 py-2 border">
                        {selectedRecord.particular}
                      </td>
                    </tr>
                  )}
                  {selectedRecord.invoiceNo && (
                    <tr>
                      <th className="px-4 py-2 border">Invoice No</th>
                      <td className="px-4 py-2 border">
                        {selectedRecord.invoiceNo}
                      </td>
                    </tr>
                  )}
                  {selectedRecord.type && (
                    <tr>
                      <th className="px-4 py-2 border">Income/ Expense</th>
                      <td className="px-4 py-2 border">
                        {selectedRecord.type}
                      </td>
                    </tr>
                  )}
                  {selectedRecord.method && (
                    <tr>
                      <th className="px-4 py-2 border">Method</th>
                      <td className="px-4 py-2 border">
                        {selectedRecord.method}
                      </td>
                    </tr>
                  )}
                  {selectedRecord.date && (
                    <tr>
                      <th className="px-4 py-2 border">Date</th>
                      <td className="px-4 py-2 border">
                        {selectedRecord.date}
                      </td>
                    </tr>
                  )}
                  {selectedRecord.status && (
                    <tr>
                      <th className="px-4 py-2 border">Status</th>
                      <td className="px-4 py-2 border">
                        {selectedRecord.status}
                      </td>
                    </tr>
                  )}
                  {selectedRecord.creator && (
                    <tr>
                      <th className="px-4 py-2 border">Creator</th>
                      <td className="px-4 py-2 border">
                        {selectedRecord.creator}
                      </td>
                    </tr>
                  )}
                  {selectedRecord.serviceFee &&
                    selectedRecord.serviceFee < 1 ? (
                    <tr>
                      <th className="px-4 py-2 border">Profit</th>
                      <td className="px-4 py-2 border">
                        {selectedRecord.serviceFee}
                      </td>
                    </tr>
                  ) : (
                    <></>
                  )}
                  {selectedRecord.amount && (
                    <tr>
                      <th className="px-4 py-2 border">Amount</th>
                      <td className="px-4 py-2 border">
                        {selectedRecord.amount} AED
                      </td>
                    </tr>
                  )}{" "}
                  {selectedRecord.remarks && (
                    <tr>
                      <th className="px-4 py-2 border">Remarks</th>
                      <td className="px-4 py-2 border">
                        {selectedRecord.remarks}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Link
                className="mt-4 text-meta-5 border py-1 hover:bg-meta-5 hover:bg-opacity-10 rounded px-4"
                href={`/accounts/transactions/edit/${selectedRecord?.type}/${selectedRecord.id}`}
              >
                Edit
              </Link>
              <Link
                className="mt-4"
                href={`/${selectedRecord?.client?.type}/${selectedRecord?.client?.id}`}
              >
                Go to Client Page
              </Link>
              <div className="flex justify-end mt-4">
                <button
                  onClick={cancelAction}
                  className="px-4 py-2 bg-red hover:bg-red-600 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        <h4 className="mb-6 font-semibold text-black dark:text-white flex justify-between items-center">
          <p className="text-lg">Payments List</p>
          <div className="gap-1 flex">
            <div
              onClick={() => setFilterOpen(true)}
              className="inline-flex capitalize justify-center items-center gap-1 hover:bg-meta-5 cursor-pointer rounded hover:bg-opacity-10 px-4 py-1 text-center font-medium text-primary"
            >
              {" "}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.65811 19.7806L9.81622 20.255H9.81622L9.65811 19.7806ZM14.6581 18.114L14.8162 18.5883H14.8162L14.6581 18.114ZM19.7071 7.29289L20.0607 7.64645L19.7071 7.29289ZM15.2929 11.7071L14.9393 11.3536L15.2929 11.7071ZM5 4.5H19V3.5H5V4.5ZM4.5 6.58579V5H3.5V6.58579H4.5ZM9.06065 11.3535L4.64645 6.93934L3.93934 7.64645L8.35355 12.0607L9.06065 11.3535ZM8.49999 12.4142V19.3063H9.49999V12.4142H8.49999ZM8.49999 19.3063C8.49999 19.9888 9.16869 20.4708 9.81622 20.255L9.49999 19.3063V19.3063H8.49999ZM9.81622 20.255L14.8162 18.5883L14.5 17.6396L9.49999 19.3063L9.81622 20.255ZM14.8162 18.5883C15.2246 18.4522 15.5 18.0701 15.5 17.6396H14.5L14.8162 18.5883ZM15.5 17.6396V12.4142H14.5V17.6396H15.5ZM19.3536 6.93934L14.9393 11.3536L15.6464 12.0607L20.0607 7.64645L19.3536 6.93934ZM19.5 5V6.58579H20.5V5H19.5ZM20.0607 7.64645C20.342 7.36514 20.5 6.98361 20.5 6.58579H19.5C19.5 6.71839 19.4473 6.84557 19.3536 6.93934L20.0607 7.64645ZM15.5 12.4142C15.5 12.2816 15.5527 12.1544 15.6464 12.0607L14.9393 11.3536C14.658 11.6349 14.5 12.0164 14.5 12.4142H15.5ZM8.35355 12.0607C8.44731 12.1544 8.49999 12.2816 8.49999 12.4142H9.49999C9.49999 12.0164 9.34196 11.6349 9.06065 11.3535L8.35355 12.0607ZM3.5 6.58579C3.5 6.98361 3.65804 7.36514 3.93934 7.64645L4.64645 6.93934C4.55268 6.84557 4.5 6.71839 4.5 6.58579H3.5ZM19 4.5C19.2761 4.5 19.5 4.72386 19.5 5H20.5C20.5 4.17157 19.8284 3.5 19 3.5V4.5ZM5 3.5C4.17157 3.5 3.5 4.17157 3.5 5H4.5C4.5 4.72386 4.72386 4.5 5 4.5V3.5Z"
                  fill="gray"
                />
              </svg>
              {filter.m || filter.t ? filter.m + " " + filter.t : "Filter"}
            </div>
            <div
              onClick={() => setSelfOpen(true)}
              className="inline-flex cursor-pointer items-center justify-center rounded-md bg-meta-5 px-4 py-1 text-center font-medium text-white hover:bg-opacity-90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 mr-1 h-3 fill-white"
                viewBox="0 0 448 512"
              >
                <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
              </svg>
              Self Deposit
            </div>
            <Link
              href={"/accounts/income"}
              className="inline-flex items-center justify-center rounded-md bg-meta-3 px-4 py-1 text-center font-medium text-white hover:bg-opacity-90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 mr-1 h-3 fill-white"
                viewBox="0 0 448 512"
              >
                <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
              </svg>
              Income
            </Link>
            <Link
              href={"/accounts/expense"}
              className="inline-flex items-center justify-center rounded-md bg-red px-4 py-1 text-center font-medium text-white hover:bg-opacity-90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 mr-1 h-3 fill-white"
                viewBox="0 0 448 512"
              >
                <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
              </svg>
              Expense
            </Link>
          </div>
        </h4>

        <div className="flex flex-col capitalize">
          <div className="grid grid-cols-3 rounded-sm bg-slate-200 dark:bg-meta-4 sm:grid-cols-8">
            <div className="p-2.5 xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                ID
              </h5>
            </div>
            <div className="p-2.5 xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Client
              </h5>
            </div>
            <div className="p-2.5 xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Particular
              </h5>
            </div>

            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Method
              </h5>
            </div>
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Amount
              </h5>
            </div>
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Profit
              </h5>
            </div>
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Time
              </h5>
            </div>

            <div className="hidden p-2.5 text-center sm:block xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Actions
              </h5>
            </div>
          </div>
          <div>
            {isLoading ? (
              <SkeletonList />
            ) : (
              records?.map((record, key) => (
                <div
                  className={`grid grid-cols-3 sm:grid-cols-8 ${key % 2 !== 0 ? "bg-gray dark:bg-slate-800" : ""} ${key === records.length - 1
                    ? ""
                    : "border-b border-stroke dark:border-strokedark"
                    }`}
                  key={key}
                >
                  <div className="flex justify-center flex-col gap-1 p-2.5 xl:p-5">
                    <p className="hidden uppercase text-black dark:text-white sm:block">
                      {(record?.suffix || "") + (record?.number || "")}
                    </p>
                    {record?.edited && (
                      <p className="hidden uppercase text-red text-xs sm:block">
                        Edited
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/${record?.client?.type !== "self" ? `${record?.client?.type}/${record?.client?.id}` : "accounts/transactions/self"}`}
                    className="flex items-center gap-3 p-2.5 xl:p-5"
                  >
                    <p className="hidden capitalize text-black dark:text-white sm:block">
                      {record?.client?.name}
                    </p>
                  </Link>

                  <div className="hidden items-center p-2.5 sm:flex xl:p-5">
                    <p className="text-meta-5">{record?.particular}</p>
                  </div>
                  <div className="flex items-center justify-center p-2.5 xl:p-5">
                    {record?.method}
                    {record?.status && (
                      <span className="text-sm border bordr-meta-5 text-meta-5 rounded-md bg-opacity-10 px-1 ml-2">
                        {record.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-center p-2.5 xl:p-5">
                    <p
                      className={clsx(
                        record?.type === "expense"
                          ? "text-red"
                          : record.method === "liability"
                            ? "text-meta-6"
                            : "text-meta-3"
                      )}
                    >
                      {record?.amount}
                      <span className="text-xs"> AED</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-center p-2.5 xl:p-5">
                    {record?.type === "expense" &&
                      record?.serviceFee &&
                      record?.serviceFee != 0 && (
                        <div className="text-center">
                          <p
                            className={clsx(
                              (record?.serviceFee || 0) > 0
                                ? "bg-meta-3"
                                : "bg-red",
                              "ml-2 px-2 text-white dark:text-black rounded-md"
                            )}
                          >
                            {" "}
                            {record?.serviceFee}{" "}
                            <span className="text-xs">AED</span>
                          </p>
                          <p>{+record.serviceFee + +record.amount}</p>
                        </div>
                      )}
                  </div>
                  <div className="flex items-center text-center justify-center p-2.5 xl:p-5">
                    <p> {record.date}</p>
                  </div>

                  <div className="flex justify-center items-center">
                    {!type && !id && (
                      <Link
                        href={`/accounts/transactions/${record?.client?.type !== "self" ? `${record?.client?.type}/${record?.client?.id}` : "self"}`}
                        className="hover:bg-slate-500 rounded hover:bg-opacity-10 p-1"
                      >
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9.65811 19.7806L9.81622 20.255H9.81622L9.65811 19.7806ZM14.6581 18.114L14.8162 18.5883H14.8162L14.6581 18.114ZM19.7071 7.29289L20.0607 7.64645L19.7071 7.29289ZM15.2929 11.7071L14.9393 11.3536L15.2929 11.7071ZM5 4.5H19V3.5H5V4.5ZM4.5 6.58579V5H3.5V6.58579H4.5ZM9.06065 11.3535L4.64645 6.93934L3.93934 7.64645L8.35355 12.0607L9.06065 11.3535ZM8.49999 12.4142V19.3063H9.49999V12.4142H8.49999ZM8.49999 19.3063C8.49999 19.9888 9.16869 20.4708 9.81622 20.255L9.49999 19.3063V19.3063H8.49999ZM9.81622 20.255L14.8162 18.5883L14.5 17.6396L9.49999 19.3063L9.81622 20.255ZM14.8162 18.5883C15.2246 18.4522 15.5 18.0701 15.5 17.6396H14.5L14.8162 18.5883ZM15.5 17.6396V12.4142H14.5V17.6396H15.5ZM19.3536 6.93934L14.9393 11.3536L15.6464 12.0607L20.0607 7.64645L19.3536 6.93934ZM19.5 5V6.58579H20.5V5H19.5ZM20.0607 7.64645C20.342 7.36514 20.5 6.98361 20.5 6.58579H19.5C19.5 6.71839 19.4473 6.84557 19.3536 6.93934L20.0607 7.64645ZM15.5 12.4142C15.5 12.2816 15.5527 12.1544 15.6464 12.0607L14.9393 11.3536C14.658 11.6349 14.5 12.0164 14.5 12.4142H15.5ZM8.35355 12.0607C8.44731 12.1544 8.49999 12.2816 8.49999 12.4142H9.49999C9.49999 12.0164 9.34196 11.6349 9.06065 11.3535L8.35355 12.0607ZM3.5 6.58579C3.5 6.98361 3.65804 7.36514 3.93934 7.64645L4.64645 6.93934C4.55268 6.84557 4.5 6.71839 4.5 6.58579H3.5ZM19 4.5C19.2761 4.5 19.5 4.72386 19.5 5H20.5C20.5 4.17157 19.8284 3.5 19 3.5V4.5ZM5 3.5C4.17157 3.5 3.5 4.17157 3.5 5H4.5C4.5 4.72386 4.72386 4.5 5 4.5V3.5Z"
                            fill="gray"
                          />
                        </svg>
                      </Link>
                    )}
                    <button
                      title="view transaction details"
                      onClick={() => handleInfo(record)}
                      className="hover:bg-slate-500 rounded hover:bg-opacity-10 p-1"
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="12" cy="12" r="9" stroke="gray" />
                        <path
                          d="M12.5 7.5C12.5 7.77614 12.2761 8 12 8C11.7239 8 11.5 7.77614 11.5 7.5C11.5 7.22386 11.7239 7 12 7C12.2761 7 12.5 7.22386 12.5 7.5Z"
                          fill="gray"
                        />
                        <path d="M12 17V10" stroke="gray" />
                      </svg>
                    </button>
                    <button
                      title="delete transaction record"
                      onClick={() => handleDelete(record?.id)}
                      className="hover:bg-red rounded hover:bg-opacity-10 p-1"
                    >
                      <svg
                        className="hover:text-primary"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9.5 14.5L9.5 11.5"
                          stroke="#FB5454"
                          strokeLinecap="round"
                        />
                        <path
                          d="M14.5 14.5L14.5 11.5"
                          stroke="#FB5454"
                          strokeLinecap="round"
                        />
                        <path
                          d="M3 6.5H21V6.5C19.5955 6.5 18.8933 6.5 18.3889 6.83706C18.1705 6.98298 17.983 7.17048 17.8371 7.38886C17.5 7.89331 17.5 8.59554 17.5 10V15.5C17.5 17.3856 17.5 18.3284 16.9142 18.9142C16.3284 19.5 15.3856 19.5 13.5 19.5H10.5C8.61438 19.5 7.67157 19.5 7.08579 18.9142C6.5 18.3284 6.5 17.3856 6.5 15.5V10C6.5 8.59554 6.5 7.89331 6.16294 7.38886C6.01702 7.17048 5.82952 6.98298 5.61114 6.83706C5.10669 6.5 4.40446 6.5 3 6.5V6.5Z"
                          stroke="#FB5454"
                          strokeLinecap="round"
                        />
                        <path
                          d="M9.5 3.50024C9.5 3.50024 10 2.5 12 2.5C14 2.5 14.5 3.5 14.5 3.5"
                          stroke="#FB5454"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="pagination-container flex justify-center items-center my-6">
        <button
          onClick={() => handlePageChange(pageNumber - 1)}
          disabled={pageNumber === 0 || isLoading}
          className={clsx(
            "px-3 py-1 mr-2 rounded-md",
            isLoading || pageNumber === 0
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "border-primary border text-primary bg-primary bg-opacity-10 hover:bg-primary hover:text-white"
          )}
        >
          Back
        </button>
        <span className="text-xl font-bold  mx-5">{pageNumber + 1}</span>
        <button
          onClick={() => handlePageChange(pageNumber + 1)}
          disabled={isLoading || !hasMore || !records.length}
          className={clsx(
            "px-3 py-1 ml-2 rounded-md",
            isLoading || !hasMore || !records.length
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "border-primary border text-primary bg-primary bg-opacity-10 hover:bg-primary hover:text-white"
          )}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default TransactionList;
