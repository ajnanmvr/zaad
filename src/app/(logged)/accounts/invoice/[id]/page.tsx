"use client"
import DefaultLayout from "@/components/Layouts/DefaultLayout"
import { TInvoiceData } from "@/types/invoice"
import axios from "axios"
import { useParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import ReactToPrint from "react-to-print"
import { formatAmountInWords } from "@/utils/numberToWords"

function SingleInvoice() {
  const [invoice, setInvoice] = useState<TInvoiceData>()
  const [isLoading, setIsLoading] = useState(true)
  const { id }: { id: string } = useParams()

  const fetchData = async () => {
    try {
      const { data } = await axios.get(`/api/invoice/${id}`)
      setInvoice(data)
      setIsLoading(false)
    } catch (error) {
      console.log(error);
    }
  }

  const componentRef = useRef(null)
  useEffect(() => {
    fetchData()
  }, [])
  console.log(invoice);

  return (
    <DefaultLayout>
      {isLoading ? <div className="flex justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div> : <>
        {invoice?.remarks && <p className="border-yellow-600 border rounded-xl px-3 py-2 mb-2 flex items-center"><span className="bg-yellow-600 text-white font-bold px-2 rounded-md inline mr-2 text-xs">Remarks:</span>
          <span className="text-xs">{invoice?.remarks}</span>
        </p>}
        <ReactToPrint trigger={() =>
          <p className="items-center justify-center rounded-t-md bg-primary px-4 py-3 text-center font-medium text-white transition-colors duration-300 cursor-pointer border hover:bg-opacity-90 text-base">
            Download / Print
          </p>
        } content={() => componentRef.current} />

        <div className="relative" ref={componentRef}>
          <img src="/images/invoice.jpg" alt="quotation Bg" />
          <div className="absolute top-0 text-[#000000] flex items-center w-full mt-[35%] flex-col uppercase px-20">

            {invoice?.quotation !== "true" ? <>
              <p className="bg-primary text-white px-4 py-2 text-lg rounded-md font-semibold">{invoice?.title}</p>
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
                  <p className="font-semibold text-sm">{invoice?.invoiceNo}</p>
                  {
                    invoice?.trn &&
                    <>
                      <p className="text-xs">TRN NUMBER</p>
                      <p className="font-semibold text-sm">{invoice?.trn}</p>
                    </>
                  }
                </div>
              </div>
              <p className="font-semibold text-base mt-8">Purpose: {invoice?.purpose || "---"}</p>

              <table className="w-full text-left mt-2 mb-8 text-sm">
                <thead className="border-y mb-10">
                  <tr>
                    <th>Description</th>
                    <th className="text-center">Rate</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-center">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice?.items?.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <p className="font-semibold text-sm">{item.title}</p>
                        <p className="text-xs">{item.desc}</p>
                      </td>
                      <td className="text-center">{item.rate.toFixed(2)}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-center">{(item.rate * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="w-full border-t font-bold flex justify-between py-2 text-sm">
                <p>Total</p>
                <p>{(invoice?.amount || 0).toFixed(2)} AED</p>
              </div>
              <div className="w-full bg-primary/50 rounded-sm text-center p-0.5 text-sm">
                <p>{formatAmountInWords(invoice?.amount || 0)}</p>
              </div>
              {
                invoice?.showBalance !== "hide" ? (
                  <>
                    <div className="w-full border-t font-bold flex justify-between py-2 text-sm">
                      <p>Advance </p>
                      <p>{(invoice?.advance || 0).toFixed(2)} AED</p>
                    </div>
                    <div className="w-full border-t font-bold flex justify-between py-2 text-sm">
                      <p>Balance</p>
                      <p>{((invoice?.amount || 0) - (invoice?.advance || 0)).toFixed(2)} AED</p>
                    </div>
                  </>
                ) : (<></>)
              }
              <p className="mt-5 text-lg font-bold">Thank You!</p>
            </>
              :
              <>

                <div className="flex justify-between w-full">
                  <div className="flex-grow">
                    <p className="text-xs">TO</p>
                    <p className="text-lg font-semibold">{invoice?.client}</p>
                    <p className="text-xs">{invoice?.location}</p>
                  </div>
                  <div className="text-xs"> <p className="text-right w-full">DATE: {invoice?.date}</p>
                    {invoice?.validTo !== "---" ? <p className="text-right w-full">VALID TO: {invoice?.validTo}</p> : null}
                    {invoice?.invoiceNo !== "---" ? <p className="text-right w-full">INVOICE NO: {invoice?.invoiceNo}</p> : null}
                  </div>

                </div>


                <p className="w-full mt-3 text-xs normal-case">
                  Thank you for considering Zaad Business Documents Services. We are delighted to provide you with the following quotation
                </p>

                {invoice?.message && <p className="w-full text-xs mt-4 normal-case">
                  {invoice?.message}
                </p>}
                <p className="font-semibold text-base mt-3">Purpose: {invoice?.purpose || "---"}</p>

                <table className="w-full text-left mt-3 text-sm">
                  <thead className="border-y">
                    <tr>
                      <th>Description</th>
                      <th className="text-center">Rate</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-center">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice?.items?.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-xs">{item.desc}</p>
                        </td>
                        <td className="text-center">{item.rate.toFixed(2)}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-center">{(item.rate * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="w-full border-t font-bold flex justify-between py-2 text-sm">
                  <p>Total</p>
                  <p>{(invoice?.amount || 0).toFixed(2)} AED</p>
                </div>

                <p className="mt-3 text-xs w-full normal-case">We look forward to assisting you, Please let us know if you have any questions or need further information.</p>
                <p className="w-full text-xs font-semibold mt-2">NOTE:</p>
                <p className="w-full text-xs normal-case">All the aforementioned costs as per the approximate fees structure of the authorities, it may subject to vary if the authorities will change the fee structure. </p>
              </>}</div>

        </div>
      </>
      }

    </DefaultLayout >
  )
}

export default SingleInvoice
