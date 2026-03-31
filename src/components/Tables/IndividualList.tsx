"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchIndividuals } from "@/libs/queries";
import { TEntityListItem, TPaginatedResponse } from "@/types/types";
import SkeletonList from "../common/SkeletonList";
import formatDate from "@/utils/formatDate";
import { PAGINATION } from "@/config/pagination";

function IndividualList() {
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const limit = PAGINATION.LIMITS.ENTITY_LIST;

  const { data, isLoading } = useQuery<TPaginatedResponse<TEntityListItem>>({
    queryKey: ["individuals", page],
    queryFn: () => fetchIndividuals(page, limit),
  });

  const individuals = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="max-w-full overflow-x-auto">
        {isLoading ? (
          <>
            <div className="mt-4 flex justify-around rounded-t-lg bg-slate-50 text-left font-medium text-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
              <div className="min-w-[220px] px-4 py-4 xl:pl-11">Name</div>
              <div className="min-w-[150px] px-4 py-4">Created</div>
            </div>
            <SkeletonList />
          </>
        ) : (
          <>
            <table className="mt-2 w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm font-semibold tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="min-w-[220px] pb-3 pl-4">Name</th>
                  <th className="min-w-[150px] px-4 pb-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {individuals.map((individual, key) => (
                  <tr
                    key={key}
                    className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-4 pl-4">
                      <h5 className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                        {individual.name}
                      </h5>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(individual.createdAt || null)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Page {pagination?.page || 1} of {pagination?.totalPages || 1}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={!pagination || pagination.page <= 1}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={!pagination || pagination.page >= pagination.totalPages}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default IndividualList;
