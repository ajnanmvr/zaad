"use client"
import DefaultLayout from "@/components/Layouts/DefaultLayout"
import { TInvoiceData } from "@/types/invoice"
import axios from "axios"
import { useParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import ReactToPrint from "react-to-print"

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
        <ReactToPrint trigger={() => <p
          className=" items-center justify-center rounded-t-md bg-primary px-4 py-3 text-center font-medium text-white transition-colors duration-300 cursor-pointer border hover:bg-opacity-90"
        >
          Download</p>} content={() => componentRef.current} />

        <div className="relative" ref={componentRef}>

          <img src="/images/invoice.jpg" alt="Invoice Bg" />
          <div className="absolute top-0 text-[#000000] flex items-center w-full mt-[35%] flex-col uppercase px-20">
            <p className="bg-green-950 text-white px-4 py-2 text-xl rounded-md font-semibold">{invoice?.title}</p>
            <div className="flex w-full justify-between mt-10">
              <div>
                <p className="text-sm">BILLED TO</p>
                <p className="text-xl font-semibold">{invoice?.client}</p>
                <p>{invoice?.location}</p>
              </div>
              <div>
                <p className="text-sm">ISSUED DATE</p>
                <p className="font-semibold">{invoice?.date}</p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-sm">INVOICE NUMBER</p>
                <p className="font-semibold">{invoice?.invoiceNo}</p>
              </div>
            </div>
            <p className="font-semibold text-lg mt-8">Purpose: {invoice?.purpose || "---"}</p>

            <table className="w-full text-left mt-2 mb-8">
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
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm">{item.desc}</p>
                    </td>
                    <td className="text-center">{item.rate} AED</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-center font-semibold">{item.rate * item.quantity} AED</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="w-full border-t font-bold flex justify-between py-2">
              <p>Total</p>
              <p>{invoice?.amount || 0} AED</p>
            </div>
            {
              invoice?.title !== "CASH RECEIPT" ? (
                <>
                  <div className="w-full border-t font-bold flex justify-between py-2">
                    <p>Advance </p>
                    <p>{invoice?.advance || 0} AED</p>
                  </div>
                  <div className="w-full border-t font-bold flex justify-between py-2">
                    <p>Balance</p>
                    <p>{(invoice?.amount || 0) - (invoice?.advance || 0)} AED</p>
                  </div>
                </>
              ) : (<></>)
            }
            <p className="mt-10 text-xl font-bold">Thank You!</p>
          </div>

        </div>
      </>
      }

    </DefaultLayout>
  )
}

export default SingleInvoice