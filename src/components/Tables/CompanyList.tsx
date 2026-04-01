"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiEye, FiTrash2 } from "react-icons/fi";

import { PAGINATION } from "@/config/pagination";
import { fetchCompanies } from "@/libs/queries";
import { TEntityListItem, TPaginatedResponse } from "@/types/types";
import formatDate from "@/utils/formatDate";

import ConfirmationModal from "../Modals/ConfirmationModal";
import DocumentStatusSummary from "../common/DocumentStatusSummary";
import EntityAvatar from "../common/EntityAvatar";
import SkeletonList from "../common/SkeletonList";
import EntityListingShell from "./EntityListingShell";

type CompanySort = "newest" | "oldest" | "name-asc" | "name-desc";

function CompanyList({ sort }: { sort?: string }) {
  const queryClient = useQueryClient();

  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<CompanySort>("newest");
  const [createdWithinDays, setCreatedWithinDays] = useState<number | undefined>(
    undefined
  );

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 320);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(PAGINATION.DEFAULT_PAGE);
  }, [search, sortBy, createdWithinDays]);

  const limit = PAGINATION.LIMITS.ENTITY_LIST;
  const {
    data: companiesResponse,
    isLoading: companyLoading,
    isError: companyError,
  } = useQuery<TPaginatedResponse<TEntityListItem>>({
    queryKey: ["companies", page, search, sortBy, createdWithinDays],
    queryFn: () => fetchCompanies(page, limit, { search, sortBy, createdWithinDays }),
  });

  const companies = companiesResponse?.data || [];
  const pagination = companiesResponse?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/company/${id}`),
    onMutate: () => {
      toast.loading("Deleting company...");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Company deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: () => {
      toast.dismiss();
      toast.error("Failed to delete company");
    },
  });

  const handleDelete = (id: string) => {
    setSelectedCompanyId(id);
    setIsConfirmationOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCompanyId) {
      deleteMutation.mutate(selectedCompanyId);
      setIsConfirmationOpen(false);
    }
  };

  const cancelDelete = () => {
    setSelectedCompanyId(null);
    setIsConfirmationOpen(false);
  };

  if (companyError) {
    toast.error("Failed to fetch companies");
  }

  const totalCount = useMemo(() => pagination?.total ?? companies.length, [pagination, companies.length]);

  return (
    <>
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        message="Are you sure you want to delete this company?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <EntityListingShell
        title="Entity Directory"
        subtitle="Explore, search, and refine your companies with real-time controls."
        addEntityHref="/company/register"
        addEntityLabel="Add Company"
        totalCount={totalCount}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        sortBy={sortBy}
        onSortChange={setSortBy}
        createdWithinDays={createdWithinDays}
        onCreatedWithinDaysChange={setCreatedWithinDays}
        isLoading={companyLoading}
        loadingContent={
          <>
            <div className="mt-1 flex justify-around rounded-t-lg bg-slate-50 text-left font-medium text-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
              <div className="min-w-[220px] px-4 py-4 xl:pl-11">Name</div>
              <div className="min-w-[150px] px-4 py-4">Created</div>
              <div className="min-w-[220px] px-4 py-4">Documents</div>
              <div className="px-4 py-4">Actions</div>
            </div>
            <SkeletonList />
          </>
        }
        emptyTitle="No companies found"
        emptyDescription="Try a broader search or switch filters to see more results."
        hasData={companies.length > 0}
        pagination={pagination}
        onPrevPage={() => setPage((prev) => Math.max(prev - 1, 1))}
        onNextPage={() => setPage((prev) => prev + 1)}
      >
        <div className="max-w-full overflow-x-auto">
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm font-semibold tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="min-w-[220px] pb-3 pl-4">Name</th>
                <th className="min-w-[150px] px-4 pb-3">Created</th>
                <th className="min-w-[220px] px-4 pb-3">Documents</th>
                <th className="px-4 pb-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(({ id, name, createdAt, color, documentStatusCounts }, key) => (
                <tr
                  key={key}
                  className="group border-b border-slate-100 transition-colors hover:bg-slate-50/70 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/40"
                >
                  <td className="py-4 pl-4">
                    <Link
                      href={sort === "a" ? `/accounts/transactions/company/${id}` : `/company/${id}`}
                    >
                      <div className="flex items-center gap-3">
                        <EntityAvatar name={name} color={color} size="md" />
                        <h5 className="font-semibold capitalize text-slate-800 transition-colors group-hover:text-primary dark:text-slate-200">
                          {name}
                        </h5>
                      </div>
                    </Link>
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
                        href={sort === "a" ? `/accounts/transactions/company/${id}` : `/company/${id}`}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                        title="View Company"
                      >
                        <FiEye className="text-lg" />
                      </Link>
                      <button
                        title="Delete Company"
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

export default CompanyList;
