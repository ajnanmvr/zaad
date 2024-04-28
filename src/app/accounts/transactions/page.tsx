"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import { useEffect, useState } from "react";
import { TRecordList } from "@/libs/types";
import TransactionList from "@/components/Tables/TransactionList";
const TablesPage = () => {
  const [records, setRecords] = useState<TRecordList[]>([{
    id: "",
    type: "",
    amount: 0,
    serviceFee: 0,
    invoiceNo: "",
    particular: "", date: ""
  }])
  const fetchData = async () => {
    try {
      const data = await axios.get("/api/payment")
      setRecords(data.data.data)
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    fetchData()
  }, [])

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Transactions" />
      <TransactionList records={records} />
    </DefaultLayout>
  );
};

export default TablesPage;
