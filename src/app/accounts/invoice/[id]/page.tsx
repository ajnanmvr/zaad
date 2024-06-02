"use client"
import DefaultLayout from "@/components/Layouts/DefaultLayout"
import { TInvoiceData } from "@/types/invoice"
import axios from "axios"
import { useParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import ReactToPrint from "react-to-print"

function SingleInvoice() {
  const [invoice, setInvoice] = useState<TInvoiceData | null>(null)
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

  return (
    <DefaultLayout>
      {isLoading ?
        <div className="flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div> :
        <>
          <ReactToPrint trigger={() => <p className="items-center justify-center rounded-t-md bg-primary px-4 py-3 text-center font-medium text-white transition-colors duration-300 cursor-pointer border hover:bg-opacity-90" >
            Download</p>} content={() => componentRef.current} />
          <div className="relative" ref={componentRef}>
            <img src="/images/invoice.jpg" alt="Invoice Bg" />
            <div className="absolute top-0 text-lg text-[#000000] flex justify-center w-full mt-[35%] ">
            </div>
          </div>
        </>
      }

    </DefaultLayout>
  )
}

export default SingleInvoice