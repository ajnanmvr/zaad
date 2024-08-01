"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import CardDataStats from "@/components/CardDataStats";
import SkeletonList from "@/components/common/SkeletonList";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import SelfDepositModal from "@/components/Modals/SelfDepositModal";
import { TRecordList } from "@/types/records";
import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";

const baseData = {
  t: "", m: ""
}

const TransactionList = () => {
  const [records, setRecords] = useState<TRecordList[]>([])
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await axios.get(`/api/payment/liability`);
      setRecords(res.data.records);
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

      <div className="col-span-12 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
        <h4 className="mb-6 px-7.5 text-xl font-semibold text-black dark:text-white">
          Company Credit List
        </h4>

        <div>
          {records.map((data, key) => (
            <Link
              href={`/${data.client.type}/${data.client.id}`}
              className="flex capitalize items-center gap-5 px-7.5 py-3 hover:bg-gray-3 dark:hover:bg-meta-4"
              key={key}
            >
              <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-meta-3"></div>

              <div className="flex flex-1 items-center justify-between">
                <div>
                  <h5 className="font-medium text-black dark:text-white">
                    {data.client.name}
                  </h5>
                </div>
                <div>
                  <h5 className="font-medium text-meta-3">
                    {(data.amount * -1).toFixed(2)} AED
                  </h5>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default TransactionList;
