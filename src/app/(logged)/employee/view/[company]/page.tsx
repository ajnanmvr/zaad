"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import EmployeeList from "@/components/Tables/EmployeeList";
import { TEntityListItem, TPagination } from "@/types/types";
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PAGINATION } from "@/config/pagination";
const TablesPage = () => {
  const params = useParams()
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE)
  const [employees, setEmployees] = useState<TEntityListItem[] | null>(null)
  const [pagination, setPagination] = useState<TPagination | undefined>(undefined)
  const fetchData = async () => {
    try {
      const data = await axios.get(`/api/employee/company/${params.company}?page=${page}&limit=${PAGINATION.LIMITS.ENTITY_LIST}`)
      setEmployees(data.data.data)
      setPagination(data.data.pagination)
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchData()
  }, [page])
  return (
    <>
      <Breadcrumb pageName={"Company Employees"} />
      <div className="flex flex-col gap-10">
        <EmployeeList
          employees={employees}
          pagination={pagination}
          onPageChange={setPage}
          addEntityHref={`/employee/register/${params.company}`}
          addEntityLabel="Add Employee"
        />
      </div>
    </>
  );
};

export default TablesPage;
