"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import EmployeeList from "@/components/Tables/EmployeeList";
import { TEmployeeList } from "@/types/types";
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
const TablesPage = () => {
  const params = useParams()
  const [employees, setEmployees] = useState<TEmployeeList[] | null>(null)
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
    <>
      <Breadcrumb pageName={"Company Employees"} />
      <div className="flex flex-col gap-10">
        <EmployeeList employees={employees} />
      </div>
    </>
  );
};

export default TablesPage;
