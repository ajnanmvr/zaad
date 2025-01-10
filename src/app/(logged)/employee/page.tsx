"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { TEmployeeList } from "@/types/types";
import EmployeeList from "@/components/Tables/EmployeeList";
import { useQuery } from "@tanstack/react-query";
import { fetchEmployees } from "@/libs/queries";
import toast from "react-hot-toast";
const TablesPage = () => {
  const { data: employees, isLoading: employeeLoading, isError: employeeError } = useQuery<TEmployeeList[] | null>({ queryKey: ["employees"], queryFn: fetchEmployees })
  if (employeeError) { toast.error("Failed to fetch employees") }

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Employees" />
      <div className="flex flex-col gap-10">
        <EmployeeList employees={employees} isLoading={employeeLoading} />
      </div>
    </DefaultLayout>
  );
};

export default TablesPage;
