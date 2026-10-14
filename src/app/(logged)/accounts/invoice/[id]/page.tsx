"use client";
import { TInvoiceData } from "@/types/invoice";
import { formatAmountInWords } from "@/utils/numberToWords";
import { hasPermission } from "@/auth/permissions";
import { useUserContext } from "@/contexts/UserContext";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ReactToPrint from "react-to-print";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { FiEdit2 } from "react-icons/fi";


function SingleInvoice() {
  const { id }: { id: string } = useParams();
  const router = useRouter();
  const { user } = useUserContext();
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canViewInvoice = hasPermission(permissions, "payments.view.invoices");
  const canUpdateInvoice = hasPermission(permissions, "payments.update.invoices");
  const componentRef = useRef(null);
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
  const initializedBreakdownRef = useRef(false);

  useEffect(() => {
    if (user && !canViewInvoice) {
      router.push("/not-permitted");
    }
  }, [user, canViewInvoice, router]);

  const { data: invoice, isLoading } = useQuery<TInvoiceData>({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/invoice/${id}`);
      return data;
    },
    enabled: Boolean(id) && canViewInvoice,
  });

  const govtFeeTotal = (invoice?.items || []).reduce(
    (sum, item) =>
      sum + (Number(item?.govtFee) || 0) * (Number(item?.quantity) || 0),
    0
  );
  const serviceFeeTotal = (invoice?.items || []).reduce(
    (sum, item) => sum + (Number(item?.rate) || 0) * (Number(item?.quantity) || 0),
    0
  );

  useEffect(() => {
    initializedBreakdownRef.current = false;
  }, [id]);

  useEffect(() => {
    if (!invoice || initializedBreakdownRef.current) return;
    initializedBreakdownRef.current = true;
    setShowFeeBreakdown(govtFeeTotal > 0);
  }, [invoice, govtFeeTotal]);

  if (!user || !canViewInvoice) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      ) : (
        <>


          {invoice?.remarks && (
            <p className="border-yellow-600 border rounded-xl px-3 py-2 mb-2 flex items-center">
              <span className="bg-yellow-600 text-white font-bold px-2 rounded-md inline mr-2 text-xs">
                Remarks:
              </span>
              <span className="text-xs">{invoice?.remarks}</span>
            </p>
          )}
          {(govtFeeTotal > 0 || canUpdateInvoice) && (
            <div className="mb-2 flex w-fit flex-wrap items-center gap-2 normal-case">
              {govtFeeTotal > 0 && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <span>Show Govt Fee &amp; Service Fee breakdown</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showFeeBreakdown}
                    onClick={() => setShowFeeBreakdown((prev) => !prev)}
                    className={clsx(
                      "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                      showFeeBreakdown ? "bg-primary" : "bg-slate-300"
                    )}
                  >
                    <span
                      className={clsx(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        showFeeBreakdown ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </label>
              )}
              {canUpdateInvoice && (
                <Link
                  href={`/accounts/invoice/${id}/edit`}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <FiEdit2 />
                  Edit Invoice
                </Link>
              )}
            </div>
          )}
          <ReactToPrint
            trigger={() => (
              <p className="items-center justify-center rounded-t-md bg-primary px-4 py-3 text-center font-medium text-white transition-colors duration-300 cursor-pointer border hover:bg-opacity-90 text-base">
                Download / Print
              </p>
            )}
            content={() => componentRef.current}
            pageStyle={`
              @page {
                size: A4;
                margin: 0;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            `}
          />

          <div
            ref={componentRef}
            className="text-black bg-white flex items-center w-full flex-col uppercase p-20 print:py-0 print:px-10 print:min-h-[275mm] print:box-border bg-invoice bg-contain"
          >
            <Image
              src="/images/invoice/header.png"
              alt="Invoice Header"
              width={1400}
              height={200}
              className="w-full h-auto mb-10"
              priority
            />

            {invoice?.quotation !== "true" ? (
              <>
                <p className="bg-primary text-white px-4 py-2 text-lg rounded-md font-semibold">
                  {invoice?.title}
                </p>
                <div className="flex w-full justify-between mt-10">
                  <div>
                    <p className="text-xs">BILLED TO</p>
                    <p className="text-lg font-semibold">{invoice?.client}</p>
                    <p className="text-xs">{invoice?.location}</p>
                  </div>
                  <div>
                    <p className="text-xs">ISSUED DATE</p>
                    <p className="font-semibold text-sm">{invoice?.date}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-xs">INVOICE NUMBER</p>
                    <p className="font-semibold text-sm">
                      {invoice?.invoiceNo}
                    </p>
                    {invoice?.trn && (
                      <>
                        <p className="text-xs">TRN NUMBER</p>
                        <p className="font-semibold text-sm">{invoice?.trn}</p>
                      </>
                    )}
                  </div>
                </div>
                <p className="font-semibold text-base mt-8">
                  Purpose: {invoice?.purpose || "---"}
                </p>

                <table className="w-full text-left mt-2 mb-8 text-sm">
                  <thead className="border-y mb-10">
                    <tr>
                      <th className="text-center">S.No</th>
                      <th>Description</th>
                      {!showFeeBreakdown && <th className="text-center">Rate</th>}
                      <th className="text-center">Quantity</th>
                      {showFeeBreakdown ? (
                        <>
                          <th className="text-center">Govt Fee</th>
                          <th className="text-center">Service Fee</th>
                          <th className="text-center">Total</th>
                        </>
                      ) : (
                        <th className="text-center">Amount</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {invoice?.items?.map((item, index) => {
                      const serviceFee = item.rate * item.quantity;
                      const itemGovtFee = Number(item.govtFee) || 0;
                      const govtFeeLineTotal = itemGovtFee * item.quantity;
                      const combinedRate = item.rate + itemGovtFee;
                      const lineTotal = serviceFee + govtFeeLineTotal;
                      return (
                      <tr key={index}>
                        <td className="text-center">{index + 1}</td>
                        <td>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-xs">{item.desc}</p>
                        </td>
                        {!showFeeBreakdown && (
                          <td className="text-center">{combinedRate.toFixed(2)}</td>
                        )}
                        <td className="text-center">{item.quantity}</td>
                        {showFeeBreakdown ? (
                          <>
                            <td className="text-center">
                              {govtFeeLineTotal ? govtFeeLineTotal.toFixed(2) : "-"}
                            </td>
                            <td className="text-center">{serviceFee.toFixed(2)}</td>
                            <td className="text-center">
                              {lineTotal.toFixed(2)}
                            </td>
                          </>
                        ) : (
                          <td className="text-center">
                            {lineTotal.toFixed(2)}
                          </td>
                        )}
                      </tr>
                      );
                    })}
                  </tbody>
                </table>

                {showFeeBreakdown && serviceFeeTotal > 0 && (
                  <div className="w-full border-t flex justify-between py-2 text-sm">
                    <p>Total Service Fee</p>
                    <p>{serviceFeeTotal.toFixed(2)} AED</p>
                  </div>
                )}
                {showFeeBreakdown && govtFeeTotal > 0 && (
                  <div className="w-full border-t flex justify-between py-2 text-sm">
                    <p>Total Govt Fee</p>
                    <p>{govtFeeTotal.toFixed(2)} AED</p>
                  </div>
                )}
                <div className="w-full border-t font-bold flex justify-between py-2 text-sm">
                  <p>Total</p>
                  <p>{(invoice?.amount || 0).toFixed(2)} AED</p>
                </div>
                <div className="w-full bg-primary/50 rounded-sm text-center p-0.5 text-sm">
                  <p>{formatAmountInWords(invoice?.amount || 0)}</p>
                </div>
                {invoice?.showBalance !== "hide" ? (
                  <>
                    <div className="w-full border-t font-bold flex justify-between py-2 text-sm">
                      <p>Advance </p>
                      <p>{(invoice?.advance || 0).toFixed(2)} AED</p>
                    </div>
                    <div className="w-full border-t font-bold flex justify-between py-2 text-sm">
                      <p>Balance</p>
                      <p>
                        {(
                          (invoice?.amount || 0) - (invoice?.advance || 0)
                        ).toFixed(2)}{" "}
                        AED
                      </p>
                    </div>
                  </>
                ) : (
                  <></>
                )}
                <p className="mt-5 text-lg font-bold">Thank You!</p>
              </>
            ) : (
              <>
                <p className="bg-primary text-white px-4 py-2 text-lg rounded-md font-semibold">
                  {invoice?.title}
                </p>
                <div className="flex justify-between w-full">
                  <div className="flex-grow">
                    <p className="text-xs">TO</p>
                    <p className="text-lg font-semibold">{invoice?.client}</p>
                    <p className="text-xs">{invoice?.location}</p>
                  </div>
                  <div className="text-xs">
                    {" "}
                    <p className="text-right w-full">DATE: {invoice?.date}</p>
                    {invoice?.validTo !== "---" ? (
                      <p className="text-right w-full">
                        VALID TO: {invoice?.validTo}
                      </p>
                    ) : null}
                    {invoice?.invoiceNo !== "---" ? (
                      <p className="text-right w-full">
                        INVOICE NO: {invoice?.invoiceNo}
                      </p>
                    ) : null}
                  </div>
                </div>

                <p className="w-full mt-3 text-xs normal-case">
                  Thank you for considering Zaad Business Documents Services. We
                  are delighted to provide you with the following quotation
                </p>

                {invoice?.message && (
                  <p className="w-full text-xs mt-4 normal-case">
                    {invoice?.message}
                  </p>
                )}
                <p className="font-semibold text-base mt-3">
                  Purpose: {invoice?.purpose || "---"}
                </p>

                <table className="w-full text-left mt-3 text-sm">
                  <thead className="border-y">
                    <tr>
                      <th className="text-center">S.No</th>
                      <th>Description</th>
                      {!showFeeBreakdown && <th className="text-center">Rate</th>}
                      <th className="text-center">Quantity</th>
                      {showFeeBreakdown ? (
                        <>
                          <th className="text-center">Govt Fee</th>
                          <th className="text-center">Service Fee</th>
                          <th className="text-center">Total</th>
                        </>
                      ) : (
                        <th className="text-center">Amount</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {invoice?.items?.map((item, index) => {
                      const serviceFee = item.rate * item.quantity;
                      const itemGovtFee = Number(item.govtFee) || 0;
                      const govtFeeLineTotal = itemGovtFee * item.quantity;
                      const combinedRate = item.rate + itemGovtFee;
                      const lineTotal = serviceFee + govtFeeLineTotal;
                      return (
                      <tr key={index}>
                        <td className="text-center">{index + 1}</td>
                        <td>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-xs">{item.desc}</p>
                        </td>
                        {!showFeeBreakdown && (
                          <td className="text-center">{combinedRate.toFixed(2)}</td>
                        )}
                        <td className="text-center">{item.quantity}</td>
                        {showFeeBreakdown ? (
                          <>
                            <td className="text-center">
                              {govtFeeLineTotal ? govtFeeLineTotal.toFixed(2) : "-"}
                            </td>
                            <td className="text-center">{serviceFee.toFixed(2)}</td>
                            <td className="text-center">
                              {lineTotal.toFixed(2)}
                            </td>
                          </>
                        ) : (
                          <td className="text-center">
                            {lineTotal.toFixed(2)}
                          </td>
                        )}
                      </tr>
                      );
                    })}
                  </tbody>
                </table>

                {showFeeBreakdown && serviceFeeTotal > 0 && (
                  <div className="w-full border-t flex justify-between py-2 text-sm">
                    <p>Total Service Fee</p>
                    <p>{serviceFeeTotal.toFixed(2)} AED</p>
                  </div>
                )}
                {showFeeBreakdown && govtFeeTotal > 0 && (
                  <div className="w-full border-t flex justify-between py-2 text-sm">
                    <p>Total Govt Fee</p>
                    <p>{govtFeeTotal.toFixed(2)} AED</p>
                  </div>
                )}
                <div className="w-full border-t font-bold flex justify-between py-2 text-sm">
                  <p>Total</p>
                  <p>{(invoice?.amount || 0).toFixed(2)} AED</p>
                </div>

                <p className="mt-3 text-xs w-full normal-case">
                  We look forward to assisting you, Please let us know if you
                  have any questions or need further information.
                </p>
                <p className="w-full text-xs font-semibold mt-2">NOTE:</p>
                <p className="w-full text-xs normal-case">
                  All the aforementioned costs as per the approximate fees
                  structure of the authorities, it may subject to vary if the
                  authorities will change the fee structure.{" "}
                </p>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default SingleInvoice;
