"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

import { TEntityListItem, TPaginatedResponse } from "@/types/types";
import EmployeeList from "@/components/Tables/EmployeeList";
import { useQuery } from "@tanstack/react-query";
import { fetchEmployees } from "@/libs/queries";
import toast from "react-hot-toast";
import { useState } from "react";
import { PAGINATION } from "@/config/pagination";

const TablesPage = () => {
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const { data: employeesResponse, isLoading: employeeLoading, isError: employeeError } = useQuery<TPaginatedResponse<TEntityListItem>>({
    queryKey: ["employees", page],
    queryFn: () => fetchEmployees(page, PAGINATION.LIMITS.ENTITY_LIST),
  });

  const employees = employeesResponse?.data;
  const pagination = employeesResponse?.pagination;

  if (employeeError) { toast.error("Failed to fetch employees") }

  return (
    <>
      <Breadcrumb pageName="Employees" />
      <div className="flex flex-col gap-10">
        <EmployeeList
          employees={employees}
          isLoading={employeeLoading}
          pagination={pagination}
          onPageChange={setPage}
          addEntityHref="/employee/register"
          addEntityLabel="Add Employee"
        />
      </div>
    </>
  );
};

export default TablesPage;
