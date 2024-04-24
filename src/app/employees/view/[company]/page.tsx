"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import { useEffect, useState } from "react";
import { TEmployeeList } from "@/libs/types";
import EmployeeList from "@/components/Tables/EmployeeList";
import { useParams } from "next/navigation";
const TablesPage = () => {
  const params = useParams()
  const [employees, setEmployees] = useState<TEmployeeList>([{
    id: "",
    name: "",
    expiryDate: "",
    docs: 0,
    status: "",
    company: { id: "", name: "" }
  }])
  const fetchData = async () => {
    try {
      const data = await axios.get(`/api/employee/company/${params.company}`)
      setEmployees(data.data.data)
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    fetchData()
  }, [])
  return (
    <DefaultLayout>
      <Breadcrumb pageName={`Employees (${employees[0].company.name})`} />
      <div className="flex flex-col gap-10">
        <EmployeeList employees={employees} />
      </div>
    </DefaultLayout>
  );
};

export default TablesPage;
