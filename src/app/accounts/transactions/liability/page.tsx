"use client"
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Client {
  name: string;
  id: string;
  type: "company" | "employee";
}

interface TransformedData {
  client: Client;
  netAmount: number;
}


const TransactionList = () => {
  const [records, setRecords] = useState<TransformedData[]>([])
  const [amount, setAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data } = await axios.get(`/api/payment/liability`);
      setRecords(data.records);
      setAmount(data.amount);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  return (
    <DefaultLayout>
      {isLoading ?
        <div className="flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
        :
        <div className="col-span-12 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
          <div className="flex justify-between items-center mb-6 px-7.5 ">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Current Liability
            </h4>
            <p>
              Net Liability  :<span className={clsx(amount > 0 ? "bg-meta-6" : "bg-meta-3", "px-2 text-white dark:text-black rounded-md")}> {amount} <span className="text-xs">AED</span></span>
            </p>
          </div>

          <div>
            {records.map((data, key) => (
              <Link
                href={`/${data.client.type}/${data.client.id}`}
                className="flex capitalize items-center gap-5 px-7.5 py-3 hover:bg-gray-3 dark:hover:bg-meta-4"
                key={key}
              >
                <div className={clsx(data.netAmount > 0 ? "bg-meta-6" : "bg-meta-3", "h-3.5 w-3.5 rounded-full border-2 border-white")}></div>

                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <h5 className="font-medium text-black dark:text-white">
                      {data.client.name}
                    </h5>
                  </div>
                  <div>
                    <h5 className={clsx(data.netAmount > 0 ? "text-meta-6" : "text-meta-3", "font-medium")}>
                      {data.netAmount} AED
                    </h5>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>}
    </DefaultLayout>
  );
};

export default TransactionList;
