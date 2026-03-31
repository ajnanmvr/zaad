"use client";

import CardDataStats from "@/components/CardDataStats";
import { TEntityListItem, TExpiryDocumentItem, TPaginatedResponse } from "@/types/types";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchCompanies, fetchEmployees, fetchExpiryDocuments, fetchIndividuals } from "@/libs/queries";
import { toast } from "react-hot-toast";
import { FiBriefcase, FiUsers, FiAlertCircle, FiEye } from "react-icons/fi";
import formatDate from "@/utils/formatDate";
import { PAGINATION } from "@/config/pagination";

export default function Home() {

  const { data: companiesResponse, isLoading: companyLoading, isError: companyError } = useQuery<TPaginatedResponse<TEntityListItem>>({ queryKey: ["companies", PAGINATION.DEFAULT_PAGE], queryFn: () => fetchCompanies(PAGINATION.DEFAULT_PAGE, PAGINATION.LIMITS.ENTITY_LIST) })
  const { data: employeesResponse, isLoading: employeeLoading, isError: employeeError } = useQuery<TPaginatedResponse<TEntityListItem>>({ queryKey: ["employees", PAGINATION.DEFAULT_PAGE], queryFn: () => fetchEmployees(PAGINATION.DEFAULT_PAGE, PAGINATION.LIMITS.ENTITY_LIST) })
  const { data: individualsResponse, isLoading: individualLoading } = useQuery<TPaginatedResponse<TEntityListItem>>({ queryKey: ["individuals", PAGINATION.DEFAULT_PAGE], queryFn: () => fetchIndividuals(PAGINATION.DEFAULT_PAGE, PAGINATION.LIMITS.ENTITY_LIST) })
  const { data: expiryResponse, isLoading: expiryLoading } = useQuery<TPaginatedResponse<TExpiryDocumentItem>>({ queryKey: ["expiry-documents", PAGINATION.DEFAULT_PAGE], queryFn: () => fetchExpiryDocuments(PAGINATION.DEFAULT_PAGE, PAGINATION.LIMITS.EXPIRY_DOCUMENTS) })

  const companies = companiesResponse?.data || [];
  const employees = employeesResponse?.data || [];

  if (companyError) {
    toast.error("An error occurred while fetching company data");
  }
  if (employeeError) {
    toast.error("An error occurred while fetching employee data");
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      {companyLoading && employeeLoading ? (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent shadow-md"></div>
        </div>
      ) : (
        <div className="space-y-6 md:space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 xl:gap-8">
            <CardDataStats loading={companyLoading} title="Total Companies" total={`${companiesResponse?.pagination?.total || 0}`} color="emerald-500">
               <FiBriefcase className="text-2xl" />
            </CardDataStats>
            
            <CardDataStats loading={employeeLoading} title="Total Employees" total={`${employeesResponse?.pagination?.total || 0}`} color="cyan-500">
               <FiUsers className="text-2xl" />
            </CardDataStats>
            
            <CardDataStats loading={individualLoading} title="Total Individuals" total={`${individualsResponse?.pagination?.total || 0}`} color="rose-500">
              <FiAlertCircle className="text-2xl" />
            </CardDataStats>
            
            <CardDataStats loading={expiryLoading} title="Expiry Documents" total={`${expiryResponse?.pagination?.total || 0}`} color="orange-500">
               <FiAlertCircle className="text-2xl" />
            </CardDataStats>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
            {/* Recent Companies Table */}
            {!companyLoading && (
              <div className="col-span-1 xl:col-span-8">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-900/50 dark:ring-slate-800/50">
                  <div className="mb-6 flex items-center justify-between">
                    <h4 className="text-xl font-bold text-slate-800 dark:text-white">
                      Recent Companies
                    </h4>
                    <Link href="/company" className="text-sm font-medium text-primary hover:underline">
                      View All
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-sm font-semibold tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          <th className="pb-3 pl-4">Name</th>
                          <th className="pb-3 px-4">Created</th>
                          <th className="pb-3 px-4">Type</th>
                          <th className="pb-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companies?.slice(0, 5).map(({ id, name, createdAt, entityType }, key) => (
                          <tr 
                            key={key} 
                            className="group border-b border-slate-100 transition-colors hover:bg-slate-50/50 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/50"
                          >
                            <td className="py-4 pl-4">
                              <div className="flex flex-col">
                                <h5 className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                                  {name}
                                </h5>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                              {formatDate(createdAt || null)}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300 uppercase">
                              {entityType}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center space-x-2">
                                <Link 
                                  href={`/company/${id}`} 
                                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                                  title="View Company"
                                >
                                  <FiEye className="text-lg" />
                                </Link>
                                <Link 
                                  href={`/employee/view/${id}`} 
                                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800"
                                  title="View Employees"
                                >
                                  <FiUsers className="text-lg" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Employees List */}
            {!employeeLoading && (
              <div className="col-span-1 xl:col-span-4">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-900/50 dark:ring-slate-800/50">
                  <div className="mb-6 flex items-center justify-between">
                    <h4 className="text-xl font-bold text-slate-800 dark:text-white">
                      Employees
                    </h4>
                    <Link href="/employee" className="text-sm font-medium text-primary hover:underline">
                      View All
                    </Link>
                  </div>

                  <div className="flex flex-col gap-2">
                    {employees?.slice(0, 7).map((employee, key) => (
                      <Link
                        href={`/employee/${employee.id}`}
                        className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50"
                        key={key}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-2.5 w-2.5 rounded-full ring-4 bg-emerald-500 ring-emerald-100 dark:ring-emerald-900/30"></div>
                          <div>
                            <h5 className="font-semibold capitalize text-slate-800 group-hover:text-primary dark:text-slate-200 transition-colors">
                              {employee.name}
                            </h5>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                {employee?.company?.name}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                {formatDate(employee.createdAt || null)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
