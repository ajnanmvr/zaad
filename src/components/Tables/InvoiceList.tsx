"use client"
import { TInvoiceList } from "@/types/invoice";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import ConfirmationModal from "../Modals/ConfirmationModal";
import { useEffect, useState } from "react";
import SkeletonList from "../common/SkeletonList";

const InvoiceList = ({ type, id }: {
  type?: string | string[], id?: string | string[]
}) => {
  const [invoices, setInvoices] = useState<TInvoiceList[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(0); // Pagination starts at page 1
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true); // New state for loading indicator
  const [isBtnDisabled, setIsBtnDisabled] = useState(true); // New state for loading indicator

  const fetchData = async () => {
    try {
      let res: any
      if (type && id) {
        if (type === "company") {
          res = await axios.get(`/api/invoice/company/${id}?page=${pageNumber}`);
        }
        if (type === "individual") {
          res = await axios.get(`/api/invoice/employee/${id}?page=${pageNumber}`);
        }
      } else {
        res = await axios.get(`/api/invoice?page=${pageNumber}`);
      }
      setHasMore(res.data.hasMore)
      setInvoices(res.data.invoices);
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

  const confirmDelete = async () => {
    await axios.delete(`/api/invoice/${selectedRecordId}`)
    setIsConfirmationOpen(false);
    fetchData()
  }
  const cancelAction = () => {
    setSelectedRecordId(null);
    setIsConfirmationOpen(false);
  }
  console.log(hasMore);

  return (
    <>
      <div className="rounded-sm border  border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          message="Are you sure you want to delete this invoice?"
          onConfirm={confirmDelete}
          onCancel={cancelAction}
        />
        <h4 className="mb-6 font-semibold text-black dark:text-white flex justify-between items-center">  <p className="text-lg">Invoice List</p>
          <div className="gap-1 flex">

            <Link

              href={"invoice/new"}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-1 text-center font-medium text-white hover:bg-opacity-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 mr-1 h-3 fill-white" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" /></svg>
              New Invoice
            </Link>

          </div>
        </h4>
        <div className="flex flex-col capitalize">
          <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-6">

            <div className="p-2.5 xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Invoice No
              </h5>
            </div>
            <div className="p-2.5 xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Client
              </h5>
            </div>
            <div className="p-2.5 xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Title
              </h5>
            </div>

            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Date
              </h5>
            </div>
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Amount
              </h5>
            </div>

            <div className="hidden p-2.5 text-center sm:block xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Actions
              </h5>
            </div>
          </div>
          <div>



            {isLoading ? <SkeletonList /> : invoices?.map((record, key) => (
              <div
                className={`grid grid-cols-3 sm:grid-cols-6 ${key === invoices.length - 1
                  ? ""
                  : "border-b border-stroke dark:border-strokedark"
                  }`}
                key={key}
              >
                <div className="flex items-center gap-3 p-2.5 xl:p-5">
                  <p className="hidden uppercase text-meta-5 sm:block">
                    {record?.invoiceNo}
                  </p>
                </div>
                <div className="flex items-center gap-3 p-2.5 xl:p-5">

                  {record?.client?.type === "company" || record.client?.type === "employee" ? <Link href={`/${record?.client?.type}/${record?.client?.id}`} className="hidden capitalize text-black dark:text-white sm:block">
                    {record?.client?.name}
                  </Link> : <div className="hidden capitalize text-black dark:text-white sm:block">
                    {record?.client?.name}<span className="text-sm border bordr-meta-5 text-red rounded-md bg-opacity-10 px-1 ml-2">Other</span>
                  </div>
                  } </div>



                <div className="hidden items-center p-2.5 sm:flex xl:p-5">
                  <p className="text-meta-5">{record?.title}</p>
                </div>
                <div className="flex items-center justify-center gap-3 p-2.5 xl:p-5">
                  <p className="hidden capitalize text-black dark:text-white sm:block">
                    {record?.date || "N/A"}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 p-2.5 xl:p-5">
                  <p className="hidden capitalize text-meta-3 sm:block">
                    {record?.amount || 0} AED
                  </p>
                </div>
                <div className="flex justify-center items-center">
                  <Link href={`/accounts/invoice/${record?.id}/edit`} className="hover:bg-slate-500 rounded hover:bg-opacity-10 p-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="3.5" stroke="gray" />
                      <path d="M20.188 10.9343C20.5762 11.4056 20.7703 11.6412 20.7703 12C20.7703 12.3588 20.5762 12.5944 20.188 13.0657C18.7679 14.7899 15.6357 18 12 18C8.36427 18 5.23206 14.7899 3.81197 13.0657C3.42381 12.5944 3.22973 12.3588 3.22973 12C3.22973 11.6412 3.42381 11.4056 3.81197 10.9343C5.23206 9.21014 8.36427 6 12 6C15.6357 6 18.7679 9.21014 20.188 10.9343Z" stroke="gray" />
                    </svg>
                  </Link>

                  <Link href={`/accounts/invoice/${record?.id}/edit`} className="hover:bg-slate-500 rounded hover:bg-opacity-10 p-1">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.92971 19.283L5.92972 19.283L5.95149 19.2775L5.95151 19.2775L8.58384 18.6194C8.59896 18.6156 8.61396 18.6119 8.62885 18.6082C8.85159 18.5528 9.04877 18.5037 9.2278 18.4023C9.40683 18.301 9.55035 18.1571 9.71248 17.9947C9.72332 17.9838 9.73425 17.9729 9.74527 17.9618L16.9393 10.7678L16.9393 10.7678L16.9626 10.7445C17.2761 10.4311 17.5461 10.1611 17.7333 9.91573C17.9339 9.65281 18.0858 9.36038 18.0858 9C18.0858 8.63961 17.9339 8.34719 17.7333 8.08427C17.5461 7.83894 17.276 7.5689 16.9626 7.2555L16.9393 7.23223L16.5858 7.58579L16.9393 7.23223L16.7678 7.06066L16.7445 7.03738C16.4311 6.72395 16.1611 6.45388 15.9157 6.2667C15.6528 6.0661 15.3604 5.91421 15 5.91421C14.6396 5.91421 14.3472 6.0661 14.0843 6.2667C13.8389 6.45388 13.5689 6.72395 13.2555 7.03739L13.2322 7.06066L6.03816 14.2547C6.02714 14.2658 6.01619 14.2767 6.00533 14.2875C5.84286 14.4496 5.69903 14.5932 5.59766 14.7722C5.4963 14.9512 5.44723 15.1484 5.39179 15.3711C5.38809 15.386 5.38435 15.401 5.38057 15.4162L4.71704 18.0703C4.71483 18.0791 4.7126 18.088 4.71036 18.097C4.67112 18.2537 4.62921 18.421 4.61546 18.5615C4.60032 18.7163 4.60385 18.9773 4.81326 19.1867C5.02267 19.3961 5.28373 19.3997 5.43846 19.3845C5.57899 19.3708 5.74633 19.3289 5.90301 19.2896C5.91195 19.2874 5.92085 19.2852 5.92971 19.283Z" stroke="#259AE6" />
                      <path d="M12.5 7.5L15.5 5.5L18.5 8.5L16.5 11.5L12.5 7.5Z" fill="#259AE6" />
                    </svg>
                  </Link>

                  <button onClick={() => handleDelete(record?.id)} className="hover:bg-red rounded hover:bg-opacity-10 p-1">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          disabled={isBtnDisabled || !hasMore || !invoices.length}
          className={clsx(
            "px-3 py-1 ml-2 rounded-md",
            (isBtnDisabled || !hasMore || !invoices.length) ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "border-primary border text-blue-500 bg-primary bg-opacity-10 hover:bg-primary hover:text-white"
          )}
        >
          Next
        </button>
      </div></>
  );
};

export default InvoiceList;
