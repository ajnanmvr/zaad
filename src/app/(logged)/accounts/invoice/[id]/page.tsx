"use client";

import { getInvoiceAction } from "@/actions/invoice";
import { TInvoiceData } from "@/types/invoice";
import { formatAmountInWords } from "@/utils/numberToWords";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ReactToPrint from "react-to-print";

function SingleInvoice() {
  const [invoice, setInvoice] = useState<TInvoiceData>();
  const [isLoading, setIsLoading] = useState(true);
  const { id }: { id: string } = useParams();

  const fetchData = async () => {
    try {
      const data = await getInvoiceAction(id);
      setInvoice(data);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  const componentRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-4 p-4 md:p-6">
      {isLoading ? (
        <div className="flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-emerald-600 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {invoice?.remarks && (
            <p className="mb-2 flex items-center rounded-xl border border-yellow-600 px-3 py-2">
              <span className="mr-2 inline rounded-md bg-yellow-600 px-2 text-xs font-bold text-white">
                Remarks:
              </span>
              <span className="text-xs">{invoice?.remarks}</span>
            </p>
          )}
          <ReactToPrint
            trigger={() => (
              <p className="cursor-pointer items-center justify-center rounded-t-md border bg-primary px-4 py-3 text-center text-base font-medium text-white transition-colors duration-300 hover:bg-opacity-90">
                Download / Print
              </p>
            )}
            content={() => componentRef.current}
          />

          <div className="relative" ref={componentRef}>
            <img src="/images/invoice.jpg" alt="quotation Bg" />
            <div className="absolute top-0 mt-[35%] flex w-full flex-col items-center px-20 text-[#000000] uppercase">
              {invoice?.quotation !== "true" ? (
                <>
                  <p className="rounded-md bg-primary px-4 py-2 text-lg font-semibold text-white">{invoice?.title}</p>
                  <div className="mt-10 flex w-full justify-between">
                    <div>
                      <p className="text-xs">BILLED TO</p>
                      <p className="text-lg font-semibold">{invoice?.client}</p>
                      <p className="text-xs">{invoice?.location}</p>
                    </div>
                    <div>
                      <p className="text-xs">ISSUED DATE</p>
                      <p className="text-sm font-semibold">{invoice?.date}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-xs">INVOICE NUMBER</p>
                      <p className="text-sm font-semibold">{invoice?.invoiceNo}</p>
                      {invoice?.trn && (
                        <>
                          <p className="text-xs">TRN NUMBER</p>
                          <p className="text-sm font-semibold">{invoice?.trn}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="mt-8 text-base font-semibold">Purpose: {invoice?.purpose || "---"}</p>

                  <table className="mb-8 mt-2 w-full text-left text-sm">
                    <thead className="mb-10 border-y">
                      <tr>
                        <th className="text-center">S.No</th>
                        <th>Description</th>
                        <th className="text-center">Rate</th>
                        <th className="text-center">Quantity</th>
                        <th className="text-center">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice?.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="text-center">{index + 1}</td>
                          <td>
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="text-xs">{item.desc}</p>
                          </td>
                          <td className="text-center">{item.rate.toFixed(2)}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-center">{(item.rate * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex w-full justify-between border-t py-2 text-sm font-bold">
                    <p>Total</p>
                    <p>{(invoice?.amount || 0).toFixed(2)} AED</p>
                  </div>
                  <div className="w-full rounded-sm bg-primary/50 p-0.5 text-center text-sm">
                    <p>{formatAmountInWords(invoice?.amount || 0)}</p>
                  </div>
                  {invoice?.showBalance !== "hide" ? (
                    <>
                      <div className="flex w-full justify-between border-t py-2 text-sm font-bold">
                        <p>Advance </p>
                        <p>{(invoice?.advance || 0).toFixed(2)} AED</p>
                      </div>
                      <div className="flex w-full justify-between border-t py-2 text-sm font-bold">
                        <p>Balance</p>
                        <p>{((invoice?.amount || 0) - (invoice?.advance || 0)).toFixed(2)} AED</p>
                      </div>
                    </>
                  ) : null}
                  <p className="mt-5 text-lg font-bold">Thank You!</p>
                </>
              ) : (
                <>
                  <div className="flex w-full justify-between">
                    <div className="flex-grow">
                      <p className="text-xs">TO</p>
                      <p className="text-lg font-semibold">{invoice?.client}</p>
                      <p className="text-xs">{invoice?.location}</p>
                    </div>
                    <div className="text-xs">
                      <p className="w-full text-right">DATE: {invoice?.date}</p>
                      {invoice?.validTo !== "---" ? <p className="w-full text-right">VALID TO: {invoice?.validTo}</p> : null}
                      {invoice?.invoiceNo !== "---" ? <p className="w-full text-right">INVOICE NO: {invoice?.invoiceNo}</p> : null}
                    </div>
                  </div>

                  <p className="mt-3 w-full text-xs normal-case">
                    Thank you for considering Zaad Business Documents Services. We are delighted to provide you with the following quotation
                  </p>

                  {invoice?.message && <p className="mt-4 w-full text-xs normal-case">{invoice?.message}</p>}
                  <p className="mt-3 text-base font-semibold">Purpose: {invoice?.purpose || "---"}</p>

                  <table className="mt-3 w-full text-left text-sm">
                    <thead className="border-y">
                      <tr>
                        <th className="text-center">S.No</th>
                        <th>Description</th>
                        <th className="text-center">Rate</th>
                        <th className="text-center">Quantity</th>
                        <th className="text-center">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice?.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="text-center">{index + 1}</td>
                          <td>
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="text-xs">{item.desc}</p>
                          </td>
                          <td className="text-center">{item.rate.toFixed(2)}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-center">{(item.rate * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex w-full justify-between border-t py-2 text-sm font-bold">
                    <p>Total</p>
                    <p>{(invoice?.amount || 0).toFixed(2)} AED</p>
                  </div>

                  <p className="mt-3 w-full text-xs normal-case">
                    We look forward to assisting you, Please let us know if you have any questions or need further information.
                  </p>
                  <p className="mt-2 w-full text-xs font-semibold">NOTE:</p>
                  <p className="w-full text-xs normal-case">
                    All the aforementioned costs as per the approximate fees structure of the authorities, it may subject to vary if the authorities will change the fee structure.
                  </p>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SingleInvoice
