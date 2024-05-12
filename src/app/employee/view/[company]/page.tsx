"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import { useEffect, useState } from "react";
import { TEmployeeList } from "@/types/types";
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
  const breadcrumbName = () => {
    if (employees[0]?.company.name !== undefined) { return `( ${employees[0]?.company.name} )` } else { return "" }
  }
  useEffect(() => {
    fetchData()
  }, [])
  return (
    <DefaultLayout>
      <Breadcrumb pageName={`Employees ${breadcrumbName()}`} />
      <div className="flex flex-col gap-10">
        <EmployeeList employees={employees} />
      </div>
    </DefaultLayout>
  );
};

export default TablesPage;
