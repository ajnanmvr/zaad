"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiEye, FiTrash2 } from "react-icons/fi";

import { TEntityListItem, TPagination } from "@/types/types";
import formatDate from "@/utils/formatDate";

import ConfirmationModal from "../Modals/ConfirmationModal";
import DocumentStatusSummary from "../common/DocumentStatusSummary";
import EntityAvatar from "../common/EntityAvatar";
import SkeletonList from "../common/SkeletonList";
import EntityListingShell from "./EntityListingShell";

type EntitySort = "newest" | "oldest" | "name-asc" | "name-desc";

function EmployeeList({
  employees,
  isLoading,
  pagination,
  onPageChange,
  addEntityHref,
  addEntityLabel,
}: {
  employees: TEntityListItem[] | null | undefined;
  isLoading?: boolean;
  pagination?: TPagination;
  onPageChange?: (page: number) => void;
  addEntityHref?: string;
  addEntityLabel?: string;
}) {
  const queryClient = useQueryClient();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<EntitySort>("newest");
  const [createdWithinDays, setCreatedWithinDays] = useState<number | undefined>(
    undefined
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/employee/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete employee");
    },
  });

  const list = useMemo(() => employees ?? [], [employees]);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = searchInput.trim().toLowerCase();
    const now = Date.now();

    const filtered = list.filter((employee) => {
      const nameMatch = employee.name.toLowerCase().includes(normalizedSearch);
      const companyMatch = employee.company?.name
        ?.toLowerCase()
        .includes(normalizedSearch);
      const searchMatch =
        normalizedSearch.length === 0 ? true : nameMatch || Boolean(companyMatch);

      if (!searchMatch) {
        return false;
      }

      if (!createdWithinDays || !employee.createdAt) {
        return true;
      }

      const createdAt = new Date(employee.createdAt).getTime();
      const daysMs = createdWithinDays * 24 * 60 * 60 * 1000;
      return now - createdAt <= daysMs;
    });

    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime()
        );
      }
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      return b.name.localeCompare(a.name);
    });

    return filtered;
  }, [list, searchInput, sortBy, createdWithinDays]);

  const handleDelete = (id: string) => {
    setSelectedEmployeeId(id);
    setIsConfirmationOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEmployeeId) {
      deleteMutation.mutate(selectedEmployeeId);
      setIsConfirmationOpen(false);
    }
  };

  const cancelDelete = () => {
    setSelectedEmployeeId(null);
    setIsConfirmationOpen(false);
  };

  const totalCount = pagination?.total ?? filteredEmployees.length;

  return (
    <>
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        message="Are you sure you want to delete this employee?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <EntityListingShell
        title="Employee Directory"
        subtitle="Search, sort, and filter employees in one unified view."
        addEntityHref={addEntityHref}
        addEntityLabel={addEntityLabel}
        totalCount={totalCount}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        sortBy={sortBy}
        onSortChange={setSortBy}
        createdWithinDays={createdWithinDays}
        onCreatedWithinDaysChange={setCreatedWithinDays}
        isLoading={Boolean(isLoading)}
        loadingContent={
          <>
            <div className="mt-4 flex justify-around rounded-t-lg bg-slate-50 text-left font-medium text-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
              <div className="min-w-[220px] px-4 py-4 xl:pl-11">Name</div>
              <div className="min-w-[170px] px-4 py-4">Company</div>
              <div className="min-w-[150px] px-4 py-4">Created</div>
              <div className="min-w-[220px] px-4 py-4">Documents</div>
              <div className="px-4 py-4">Actions</div>
            </div>
            <SkeletonList />
          </>
        }
        emptyTitle="No employees found"
        emptyDescription="Try a broader search or switch filters to see more results."
        hasData={filteredEmployees.length > 0}
        pagination={pagination}
        onPrevPage={
          pagination && onPageChange
            ? () => onPageChange(Math.max(pagination.page - 1, 1))
            : undefined
        }
        onNextPage={
          pagination && onPageChange
            ? () => onPageChange(pagination.page + 1)
            : undefined
        }
      >
        <div className="max-w-full overflow-x-auto">
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm font-semibold tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="min-w-[220px] pb-3 pl-4">Name</th>
                <th className="min-w-[170px] px-4 pb-3">Company</th>
                <th className="min-w-[150px] px-4 pb-3">Created</th>
                <th className="min-w-[220px] px-4 pb-3">Documents</th>
                <th className="px-4 pb-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(({ id, name, company, createdAt, color, documentStatusCounts }, key) => (
                <tr
                  key={key}
                  className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="py-4 pl-4">
                    <div className="flex items-center gap-3">
                      <EntityAvatar name={name} color={color} size="md" />
                      <Link href={`/employee/${id}`}>
                        <h5 className="font-semibold capitalize text-slate-800 transition-colors group-hover:text-primary dark:text-slate-200">
                          {name}
                        </h5>
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {company?._id ? (
                      <Link
                        href={`/company/${company._id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {company.name}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {formatDate(createdAt || null)}
                  </td>
                  <td className="px-4 py-4">
                    <DocumentStatusSummary counts={documentStatusCounts} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <Link
                        href={`/employee/${id}`}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                        title="View Employee"
                      >
                        <FiEye className="text-lg" />
                      </Link>
                      <button
                        title="Delete Employee"
                        onClick={() => handleDelete(id!)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-slate-800"
                      >
                        <FiTrash2 className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EntityListingShell>
    </>
  );
}

export default EmployeeList;
