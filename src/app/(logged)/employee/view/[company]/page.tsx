"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import EmployeeList from "@/components/Tables/EmployeeList";
import { TEntityListItem, TPagination } from "@/types/types";
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PAGINATION } from "@/config/pagination";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
const TablesPage = () => {
  const params = useParams()
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE)
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<any>("newest");
  const [createdWithinDays, setCreatedWithinDays] = useState<number | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 320);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(PAGINATION.DEFAULT_PAGE);
  }, [search, sortBy, createdWithinDays]);

  const { data, isLoading } = useQuery<{ data: TEntityListItem[]; pagination: TPagination }>({
    queryKey: ["company-employees", params.company, page, search, sortBy, createdWithinDays],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(PAGINATION.LIMITS.ENTITY_LIST),
      });
      if (search) queryParams.set("search", search);
      if (sortBy) queryParams.set("sortBy", sortBy);
      if (createdWithinDays !== undefined) queryParams.set("createdWithinDays", String(createdWithinDays));

      const { data } = await axios.get(`/api/employee/company/${params.company}?${queryParams.toString()}`)
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
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          sortBy={sortBy}
          onSortChange={setSortBy}
          createdWithinDays={createdWithinDays}
          onCreatedWithinDaysChange={setCreatedWithinDays}
        />
      </div>
    </>
  );
};

export default TablesPage;
