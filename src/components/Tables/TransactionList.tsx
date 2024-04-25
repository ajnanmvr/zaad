"use client"
import { TRecordList } from "@/libs/types";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import ConfirmationModal from "../Modals/ConfirmationModal";


const TransactionList = ({ records }: { records: TRecordList[] }) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const handleDelete = (id: string) => {
    setSelectedRecordId(id);
    setIsConfirmationOpen(true);
  }
  const confirmDelete = async () => {
    console.log("Deleting Record with ID:", selectedRecordId);
    const data = await axios.delete(`/api/payment/${selectedRecordId}`)
    console.log(data);
    window.location.reload();
    setIsConfirmationOpen(false);
  }
  const cancelDelete = () => {
    setSelectedRecordId(null);
    setIsConfirmationOpen(false);
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        message="Are you sure you want to delete this payment record?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      <h4 className="mb-6 font-semibold text-black dark:text-white flex justify-between items-center">  <p className="text-lg">Record payments</p>

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

      <div className="flex flex-col">
        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-6">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Client
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Invoice No
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Transaction
            </h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Particular
            </h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Date
            </h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Delete
            </h5>
          </div>
        </div>

        {records.map((record, key) => (
          <div
            className={`grid grid-cols-3 sm:grid-cols-6 ${key === records.length - 1
              ? ""
              : "border-b border-stroke dark:border-strokedark"
              }`}
            key={key}
          >
            <div className="flex items-center gap-3 p-2.5 xl:p-5">

              <p className="hidden text-black dark:text-white sm:block">
                {record?.company}{record?.employee}{record?.self}
              </p>
            </div>

            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <Link href={`/accounts/invoice/${record.invoiceNo}`} className="text-black dark:text-white">{record.invoiceNo}</Link>
            </div>

            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className={clsx(record.type === "income" ? "text-meta-3" : "text-red")}>{record.amount} <span className="text-xs">AED</span></p>
            </div>

            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-meta-5">{record.particular}</p>
            </div>
            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-black dark:text-white">{record.date}</p>

            </div>
            <div className="flex justify-center items-center">            <button onClick={() => handleDelete(record.id)} className="hover:bg-red rounded hover:bg-opacity-10 p-1">
              <svg className="hover:text-primary" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.5 14.5L9.5 11.5" stroke="#FB5454" stroke-linecap="round" />
                <path d="M14.5 14.5L14.5 11.5" stroke="#FB5454" stroke-linecap="round" />
                <path d="M3 6.5H21V6.5C19.5955 6.5 18.8933 6.5 18.3889 6.83706C18.1705 6.98298 17.983 7.17048 17.8371 7.38886C17.5 7.89331 17.5 8.59554 17.5 10V15.5C17.5 17.3856 17.5 18.3284 16.9142 18.9142C16.3284 19.5 15.3856 19.5 13.5 19.5H10.5C8.61438 19.5 7.67157 19.5 7.08579 18.9142C6.5 18.3284 6.5 17.3856 6.5 15.5V10C6.5 8.59554 6.5 7.89331 6.16294 7.38886C6.01702 7.17048 5.82952 6.98298 5.61114 6.83706C5.10669 6.5 4.40446 6.5 3 6.5V6.5Z" stroke="#FB5454" stroke-linecap="round" />
                <path d="M9.5 3.50024C9.5 3.50024 10 2.5 12 2.5C14 2.5 14.5 3.5 14.5 3.5" stroke="#FB5454" stroke-linecap="round" />
              </svg>
            </button></div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionList;
