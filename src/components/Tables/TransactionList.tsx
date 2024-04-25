"use client"
import { TRecordList } from "@/libs/types";
import clsx from "clsx";
import Link from "next/link";


const TransactionList = ({ records }: { records: TRecordList[] }) => {
  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
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
        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-5">
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
        </div>

        {records.map((record, key) => (
          <div
            className={`grid grid-cols-3 sm:grid-cols-5 ${key === records.length - 1
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionList;
