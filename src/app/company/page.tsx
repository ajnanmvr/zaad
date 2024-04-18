"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import { useEffect, useState } from "react";
import { TListCompanies } from "@/libs/types";
import CompanyList from "@/components/Tables/CompanyList";
const TablesPage = () => {
  const [companies, setCompanies] = useState<TListCompanies>([{
    id: "",
    name: "",
    expiryDate: "",
    docs: 0,
    status: ""
  }])
  const fetchData = async () => {
    try {
      const data = await axios.get("/api/company")
      setCompanies(data.data.data)
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    fetchData()
  }, [])
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Companies" />
      <div className="flex flex-col gap-10">
        <CompanyList companies={companies} />
      </div>
    </DefaultLayout>
  );
};

export default TablesPage;
