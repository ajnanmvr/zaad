"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

import { TEntityListItem, TPaginatedResponse } from "@/types/types";
import EmployeeList from "@/components/Tables/EmployeeList";
import { useQuery } from "@tanstack/react-query";
import { fetchEmployees } from "@/libs/queries";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { PAGINATION } from "@/config/pagination";

const TablesPage = () => {
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [limit, setLimit] = useState<number>(PAGINATION.LIMITS.ENTITY_LIST);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name-asc" | "name-desc">("newest");
  const [createdWithinDays, setCreatedWithinDays] = useState<number | undefined>(undefined);
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 320);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(PAGINATION.DEFAULT_PAGE);
  }, [search, sortBy, createdWithinDays, showDeleted]);

  const { data: employeesResponse, isLoading: employeeLoading, isError: employeeError } = useQuery<TPaginatedResponse<TEntityListItem>>({
    queryKey: ["employees", page, limit, search, sortBy, createdWithinDays, showDeleted],
    queryFn: () => fetchEmployees(page, limit, { search, sortBy, createdWithinDays, deleted: showDeleted }),
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
          pageSize={limit}
          onPageSizeChange={(size) => {
            setLimit(size);
            setPage(PAGINATION.DEFAULT_PAGE);
          }}
          addEntityHref="/employee/register"
          addEntityLabel="Add Employee"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          sortBy={sortBy}
          onSortChange={setSortBy}
          createdWithinDays={createdWithinDays}
          onCreatedWithinDaysChange={setCreatedWithinDays}
          showDeleted={showDeleted}
          onShowDeletedChange={setShowDeleted}
        />
      </div>
    </>
  );
};

export default TablesPage;
