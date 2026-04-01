"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiPlus } from "react-icons/fi";

import { fetchIndividuals } from "@/libs/queries";
import { PAGINATION } from "@/config/pagination";
import { TEntityListItem, TPaginatedResponse } from "@/types/types";
import formatDate from "@/utils/formatDate";

import AddHandoverModal from "../Modals/AddHandoverModal";
import DocumentStatusSummary from "../common/DocumentStatusSummary";
import EntityAvatar from "../common/EntityAvatar";
import SkeletonList from "../common/SkeletonList";
import EntityListingShell from "./EntityListingShell";

type EntitySort = "newest" | "oldest" | "name-asc" | "name-desc";

function IndividualList() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIndividual, setSelectedIndividual] = useState<
    { id: string; name: string } | null
  >(null);

  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<EntitySort>("newest");
  const [createdWithinDays, setCreatedWithinDays] = useState<number | undefined>(
    undefined
  );

  const limit = PAGINATION.LIMITS.ENTITY_LIST;

  const { data, isLoading } = useQuery<TPaginatedResponse<TEntityListItem>>({
    queryKey: ["individuals", page],
    queryFn: () => fetchIndividuals(page, limit),
  });

  const individuals = useMemo(() => data?.data || [], [data]);
  const pagination = data?.pagination;

  const filteredIndividuals = useMemo(() => {
    const normalizedSearch = searchInput.trim().toLowerCase();
    const now = Date.now();

    const filtered = individuals.filter((individual) => {
      const nameMatch = individual.name.toLowerCase().includes(normalizedSearch);
      const searchMatch = normalizedSearch.length === 0 ? true : nameMatch;

      if (!searchMatch) {
        return false;
      }

      if (!createdWithinDays || !individual.createdAt) {
        return true;
      }

      const createdAt = new Date(individual.createdAt).getTime();
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
  }, [individuals, searchInput, sortBy, createdWithinDays]);

  return (
    <>
      <EntityListingShell
        title="Individual Directory"
        subtitle="Find and manage individuals with search, sorting, and quick handover actions."
        addEntityHref="/individual/register"
        addEntityLabel="Add Individual"
        totalCount={pagination?.total ?? filteredIndividuals.length}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        sortBy={sortBy}
        onSortChange={setSortBy}
        createdWithinDays={createdWithinDays}
        onCreatedWithinDaysChange={setCreatedWithinDays}
        isLoading={isLoading}
        loadingContent={
          <>
            <div className="mt-4 flex justify-around rounded-t-lg bg-slate-50 text-left font-medium text-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
              <div className="min-w-[220px] px-4 py-4 xl:pl-11">Name</div>
              <div className="min-w-[150px] px-4 py-4">Created</div>
              <div className="min-w-[220px] px-4 py-4">Documents</div>
            </div>
            <SkeletonList />
          </>
        }
        emptyTitle="No individuals found"
        emptyDescription="Try a broader search or switch filters to see more results."
        hasData={filteredIndividuals.length > 0}
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
                <th className="px-4 pb-3 text-center">Handover</th>
              </tr>
            </thead>
            <tbody>
              {filteredIndividuals.map((individual, key) => (
                <tr
                  key={key}
                  className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="py-4 pl-4">
                    <div className="flex items-center gap-3">
                      <EntityAvatar
                        name={individual.name}
                        color={individual.color}
                        size="md"
                      />
                      <h5 className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                        {individual.name}
                      </h5>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {formatDate(individual.createdAt || null)}
                  </td>
                  <td className="px-4 py-4">
                    <DocumentStatusSummary counts={individual.documentStatusCounts} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          setSelectedIndividual({ id: individual._id!, name: individual.name });
                          setShowAddModal(true);
                        }}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-primary hover:text-white dark:border-slate-700 dark:text-slate-400 dark:hover:bg-primary dark:hover:text-white"
                      >
                        <FiPlus />
                        Record
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EntityListingShell>

      {showAddModal && selectedIndividual && (
        <AddHandoverModal
          isOpen={showAddModal}
          onSuccess={() => setShowAddModal(false)}
          onCancel={() => setShowAddModal(false)}
          initialEntity={{
            id: selectedIndividual.id,
            name: selectedIndividual.name,
            type: "individual",
          }}
        />
      )}
    </>
  );
}

export default IndividualList;
