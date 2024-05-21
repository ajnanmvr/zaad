"use client"
import { TRecordList } from "@/types/records";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import ConfirmationModal from "../Modals/ConfirmationModal";
import { useEffect, useState } from "react";
import SkeletonList from "../common/SkeletonList";

const TransactionList = ({ type, id }: {
  type?: string | string[], id?: string | string[]
}) => {
  const [records, setRecords] = useState<TRecordList[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<TRecordList | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(0); // Pagination starts at page 1
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true); // New state for loading indicator
  const [isBtnDisabled, setIsBtnDisabled] = useState(true); // New state for loading indicator

  const fetchData = async () => {
    try {
      let res: any
      if (type && id) {
        if (type === "company") {
          res = await axios.get(`/api/payment/company/${id}?page=${pageNumber}`);
        }
        if (type === "indivudial") {
          res = await axios.get(`/api/payment?page=${pageNumber}`);
        }
      } else {
        res = await axios.get(`/api/payment?page=${pageNumber}`);
      }
      setHasMore(res.data.hasMore)
      setRecords(res.data.records);
      setIsLoading(false);
      setIsBtnDisabled(false)
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
      setHasMore(false)
    }
  };

  useEffect(() => {
    setIsBtnDisabled(true)
    fetchData();
  }, [pageNumber]);

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };


  const handleDelete = (id: string) => {
    setSelectedRecordId(id);
    setIsConfirmationOpen(true);
  }
  const handleInfo = (record: TRecordList) => {
    setSelectedRecord(record);
    setIsInfoOpen(true);
  };
  const confirmDelete = async () => {
    await axios.delete(`/api/payment/${selectedRecordId}`)
    setIsConfirmationOpen(false);
    fetchData()
  }
  const cancelAction = () => {
    setSelectedRecordId(null);
    setIsConfirmationOpen(false);
    setIsInfoOpen(false);
  }
  console.log(hasMore);

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          message="Are you sure you want to delete this payment record?"
          onConfirm={confirmDelete}
          onCancel={cancelAction}
        />
        {isInfoOpen && selectedRecord && (
          <div className="fixed z-999 inset-0 flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white capitalize dark:bg-black flex flex-col items-center justify-center p-5 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
              <table className="table-auto w-full">
                <tbody>
                  {selectedRecord.client && (
                    <>
                      <tr>
                        <th className="px-4 py-2 border">Client Name</th>
                        <td className="px-4 py-2 border">{selectedRecord.client.name}</td>
                      </tr>
                      <tr>
                        <th className="px-4 py-2 border">Client Type</th>
                        <td className="px-4 py-2 border">{selectedRecord.client.type}</td>
                      </tr>
                    </>
                  )}
                  {selectedRecord.particular && (
                    <tr>
                      <th className="px-4 py-2 border">Particular</th>
                      <td className="px-4 py-2 border">{selectedRecord.particular}</td>
                    </tr>
                  )}
                  {selectedRecord.invoiceNo && (
                    <tr>
                      <th className="px-4 py-2 border">Invoice No</th>
                      <td className="px-4 py-2 border">{selectedRecord.invoiceNo}</td>
                    </tr>
                  )}
                  {selectedRecord.type && (
                    <tr>
                      <th className="px-4 py-2 border">Income/ Expense</th>
                      <td className="px-4 py-2 border">{selectedRecord.type}</td>
                    </tr>
                  )}
                  {selectedRecord.method && (
                    <tr>
                      <th className="px-4 py-2 border">Method</th>
                      <td className="px-4 py-2 border">{selectedRecord.method}</td>
                    </tr>
                  )}
                  {selectedRecord.date && (
                    <tr>
                      <th className="px-4 py-2 border">Date</th>
                      <td className="px-4 py-2 border">{selectedRecord.date}</td>
                    </tr>
                  )}
                  {selectedRecord.status && (
                    <tr>
                      <th className="px-4 py-2 border">Status</th>
                      <td className="px-4 py-2 border">{selectedRecord.status}</td>
                    </tr>
                  )}
                  {selectedRecord.creator && (
                    <tr>
                      <th className="px-4 py-2 border">Creator</th>
                      <td className="px-4 py-2 border">{selectedRecord.creator}</td>
                    </tr>
                  )}
                  {selectedRecord.serviceFee && selectedRecord.serviceFee < 1 ? (
                    <tr>
                      <th className="px-4 py-2 border">Service Fee</th>
                      <td className="px-4 py-2 border">{selectedRecord.serviceFee}</td>
                    </tr>
                  ) : <></>}
                  {selectedRecord.amount && (
                    <tr>
                      <th className="px-4 py-2 border">Amount</th>
                      <td className="px-4 py-2 border">{selectedRecord.amount} AED</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Link className="mt-4" href={`/${selectedRecord?.client?.type}/${selectedRecord?.client?.id}`}>
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


        <h4 className="mb-6 font-semibold text-black dark:text-white flex justify-between items-center">  <p className="text-lg">Payments List</p>

          <div className="gap-1 flex">

            <Link

              href={"transactions/income"}
              className="inline-flex items-center justify-center rounded-md bg-meta-3 px-4 py-1 text-center font-medium text-white hover:bg-opacity-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 mr-1 h-3 fill-white" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" /></svg>
              Income
            </Link>
            <Link
              href={"transactions/expense"}
              className="inline-flex items-center justify-center rounded-md bg-red px-4 py-1 text-center font-medium text-white hover:bg-opacity-90"
            ><svg xmlns="http://www.w3.org/2000/svg" className="w-3 mr-1 h-3 fill-white" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" /></svg>
              Expense
            </Link>
          </div>
        </h4>

        <div className="flex flex-col capitalize">
          <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-5">

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
                Transaction
              </h5>
            </div>

            <div className="hidden p-2.5 text-center sm:block xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Actions
              </h5>
            </div>
          </div>
          <div>



            {isLoading ? <SkeletonList /> : records.map((record, key) => (
              <div
                className={`grid grid-cols-3 sm:grid-cols-5 ${key === records.length - 1
                  ? ""
                  : "border-b border-stroke dark:border-strokedark"
                  }`}
                key={key}
              >
                <Link href={`/${record?.client?.type}/${record?.client?.id}`} className="flex hover:underline items-center gap-3 p-2.5 xl:p-5">
                  <p className="hidden capitalize text-black dark:text-white sm:block">
                    {record?.client?.name}
                  </p>
                </Link>

                <div className="hidden items-center p-2.5 sm:flex xl:p-5">
                  <p className="text-meta-5">{record?.particular}</p>
                </div>
                <div className="flex items-center justify-center p-2.5 xl:p-5">
                  {record?.method}
                </div>

                <div className="flex items-center justify-center p-2.5 xl:p-5">
                  <p className={clsx(record?.type === "income" ? "text-meta-3" : "text-red")}>{record?.amount}

                    {record?.type === "expense" && record?.serviceFee && record?.serviceFee !== 0 ? (
                      <span> + {record?.serviceFee}</span>
                    ) : <></>}
                    &nbsp;
                    <span className="text-xs">AED</span></p>
                </div>


                <div className="flex justify-center items-center">
                  <button onClick={() => handleInfo(record)} className="hover:bg-slate-500 rounded hover:bg-opacity-10 p-1">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="9" stroke="gray" />
                      <path d="M12.5 7.5C12.5 7.77614 12.2761 8 12 8C11.7239 8 11.5 7.77614 11.5 7.5C11.5 7.22386 11.7239 7 12 7C12.2761 7 12.5 7.22386 12.5 7.5Z" fill="gray" />
                      <path d="M12 17V10" stroke="gray" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(record?.id)} className="hover:bg-red rounded hover:bg-opacity-10 p-1">
                    <svg className="hover:text-primary" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.5 14.5L9.5 11.5" stroke="#FB5454" strokeLinecap="round" />
                      <path d="M14.5 14.5L14.5 11.5" stroke="#FB5454" strokeLinecap="round" />
                      <path d="M3 6.5H21V6.5C19.5955 6.5 18.8933 6.5 18.3889 6.83706C18.1705 6.98298 17.983 7.17048 17.8371 7.38886C17.5 7.89331 17.5 8.59554 17.5 10V15.5C17.5 17.3856 17.5 18.3284 16.9142 18.9142C16.3284 19.5 15.3856 19.5 13.5 19.5H10.5C8.61438 19.5 7.67157 19.5 7.08579 18.9142C6.5 18.3284 6.5 17.3856 6.5 15.5V10C6.5 8.59554 6.5 7.89331 6.16294 7.38886C6.01702 7.17048 5.82952 6.98298 5.61114 6.83706C5.10669 6.5 4.40446 6.5 3 6.5V6.5Z" stroke="#FB5454" strokeLinecap="round" />
                      <path d="M9.5 3.50024C9.5 3.50024 10 2.5 12 2.5C14 2.5 14.5 3.5 14.5 3.5" stroke="#FB5454" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="pagination-container flex justify-center items-center my-6">
        <button
          onClick={() => handlePageChange(pageNumber - 1)}
          disabled={pageNumber === 0 || isBtnDisabled}
          className={clsx(
            "px-3 py-1 mr-2 rounded-md",
            isBtnDisabled || pageNumber === 0 ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "border-primary border text-blue-500 bg-primary bg-opacity-10 hover:bg-primary hover:text-white"
          )}
        >
          Back
        </button>
        <span className="text-xl font-bold  mx-5">{pageNumber + 1}</span>
        <button
          onClick={() => handlePageChange(pageNumber + 1)}
          disabled={isBtnDisabled || !hasMore || !records.length}
          className={clsx(
            "px-3 py-1 ml-2 rounded-md",
            (isBtnDisabled || !hasMore || !records.length) ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "border-primary border text-blue-500 bg-primary bg-opacity-10 hover:bg-primary hover:text-white"
          )}
        >
          Next
        </button>
      </div></>
  );
};

export default TransactionList;
