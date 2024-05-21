"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import { useEffect, useState } from "react";
import { TEmployeeList } from "@/types/types";
import EmployeeList from "@/components/Tables/EmployeeList";
const TablesPage = () => {

  const [isLoading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<TEmployeeList[] | null>(null)
  const fetchData = async () => {
    try {
      const data = await axios.get("/api/employee")
      setEmployees(data.data.data)
      setLoading(false)
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    fetchData()
  }, [])
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Employees" />
      <div className="flex flex-col gap-10">
        <EmployeeList employees={employees} isLoading={isLoading} />
      </div>
    </DefaultLayout>
  );
};

export default TablesPage;
