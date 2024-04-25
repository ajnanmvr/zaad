"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TRecordList } from "@/libs/types";

const TablesPage = () => {
  const params = useParams()
  const [records, setRecords] = useState<TRecordList[]>([{
    type: "",
    amount: 0,
    invoiceNo: "",
    particular: "", date: ""
  }])
  const fetchData = async () => {
    try {
      const data = await axios.get(`/api/payment/invoice/${params.id}`)
      setRecords(data.data.data)
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    fetchData()
  }, [])



  const generatePDF = () => {
    const doc = new jsPDF() as any;

    const backgroundImageUrl = '/images/invoice.jpg'; // Update the path to your background image

    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();

    fetch(backgroundImageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const imgData = URL.createObjectURL(blob);

        doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

        const tableHeaders = ['Particular', 'Unit Price', 'Quantity', 'Amount'];

        // Create table data with two rows per record
        const tableData: ((string | number)[] | (string | undefined)[])[] = [];
        records.forEach((record) => {
          tableData.push([
            record.particular,
            `${record.amount} AED`,
            1,
            `${record.amount} AED`,
          ]);
          if (record.desc && record.desc.trim() !== '') {
            tableData.push([
              record.desc
            ]);
          }
        });

        // Calculate total amount
        const totalAmount = records.reduce((total, record) => total + record.amount, 0);

        // Add total row to table data
        const totalRow = ['', '', 'Total Amount:', `${totalAmount} AED`];

        doc.autoTable({
          startY: 80, // Start Y position for the table
          head: [tableHeaders],
          body: tableData,
          foot: [totalRow],
          theme: 'striped', // Optional: 'striped', 'grid', 'plain', 'css'
          margin: { top: 10 },
        });

        doc.save('invoice.pdf');
      });
  };





  return (
    <DefaultLayout>
      <Breadcrumb pageName={`Invoice ${params.id}`} />
      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h4 className="mb-6 font-semibold text-black dark:text-white flex justify-between items-center">  <p className="text-lg">Payment Records</p>
          <div className="gap-1 flex">
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-1 text-center font-medium text-white hover:bg-opacity-90"

              onClick={generatePDF}>Download PDF</button>

          </div>
        </h4>

        <div className="flex flex-col">
          <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-5">
            <div className="hidden p-2.5 text-center sm:block xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Particular
              </h5>
            </div>
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Transaction
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
              <div className="flex capitalize flex-col items-start p-2.5 xl:p-5">
                <p className="text-meta-5">{record.particular}</p>

                <p className="hidden text-black opacity-80 dark:text-white text-sm sm:block">
                  {record?.desc}
                </p>
              </div>


              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="text-meta-3">{record.amount} <span className="text-xs">AED</span></p>
              </div>


              <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                <p className="text-black dark:text-white">{record.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default TablesPage;
