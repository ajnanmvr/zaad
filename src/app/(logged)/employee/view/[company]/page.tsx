"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useEffect, useState } from "react";
import { TEmployeeList } from "@/types/types";
import EmployeeList from "@/components/Tables/EmployeeList";
import { useParams } from "next/navigation";
import { listEmployeesByCompanyAction } from "@/actions/company-employee";
const TablesPage = () => {
  const params = useParams()
  const [employees, setEmployees] = useState<TEmployeeList[] | null>(null)
  const fetchData = async () => {
    try {
      const result = await listEmployeesByCompanyAction(params.company as string)
      setEmployees(result.data)
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchData()
  }, [])
  return (
    <DefaultLayout>
      <Breadcrumb pageName={"Company Employees"} />
      <div className="flex flex-col gap-10">
        <EmployeeList employees={employees} />
      </div>
    </DefaultLayout>
  );
};

export default TablesPage;
