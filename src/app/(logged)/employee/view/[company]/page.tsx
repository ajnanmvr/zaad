"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import EmployeeList from "@/components/Tables/EmployeeList";
import { TEntityListItem, TPagination } from "@/types/types";
import axios from "axios";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PAGINATION } from "@/config/pagination";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
const TablesPage = () => {
  const params = useParams()
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE)
  const { data, isLoading } = useQuery<{ data: TEntityListItem[]; pagination: TPagination }>({
    queryKey: ["company-employees", params.company, page],
    queryFn: async () => {
      const { data } = await axios.get(`/api/employee/company/${params.company}?page=${page}&limit=${PAGINATION.LIMITS.ENTITY_LIST}`)
      return data
    },
    placeholderData: keepPreviousData,
    enabled: Boolean(params.company),
  })
  return (
    <>
      <Breadcrumb pageName={"Company Employees"} />
      <div className="flex flex-col gap-10">
        <EmployeeList
          employees={data?.data || null}
          pagination={data?.pagination}
          onPageChange={setPage}
          addEntityHref={`/employee/register/${params.company}`}
          addEntityLabel="Add Employee"
          isLoading={isLoading}
        />
      </div>
    </>
  );
};

export default TablesPage;
