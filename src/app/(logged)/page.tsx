"use client";

import CardDataStats from "@/components/CardDataStats";
import { TCompanyList, TEmployeeList } from "@/types/types";
import Link from "next/link";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { fetchCompanies,  fetchEmployees } from "@/libs/queries";
import { toast } from "react-hot-toast";
import { FiBriefcase, FiUsers, FiAlertCircle, FiEye } from "react-icons/fi";

export default function Home() {

  const { data: companies, isLoading: companyLoading, isError: companyError } = useQuery<TCompanyList[] | null>({ queryKey: ["companies"], queryFn: fetchCompanies })
  const { data: employees, isLoading: employeeLoading, isError: employeeError } = useQuery<TEmployeeList[] | null>({ queryKey: ["employees"], queryFn: fetchEmployees })

  const calculateCompanyRenewalsCount = () => {
    const renewalCompanies = companies?.filter(
      ({ status }) => status === "expired" || status === "renewal"
    );
    return renewalCompanies?.length;
  };
  const calculateEmployeeRenewalsCount = () => {
    const renewalEmployees = employees?.filter(
      ({ status }) => status === "expired" || status === "renewal"
    );
    return renewalEmployees?.length;
  };

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
            <CardDataStats loading={companyLoading} title="Total Companies" total={`${companies?.length || 0}`} color="emerald-500">
               <FiBriefcase className="text-2xl" />
            </CardDataStats>
            
            <CardDataStats loading={employeeLoading} title="Total Employees" total={`${employees?.length || 0}`} color="cyan-500">
               <FiUsers className="text-2xl" />
            </CardDataStats>
            
            <CardDataStats loading={companyLoading} title="Company Renewals" total={`${calculateCompanyRenewalsCount() || 0}`} color="rose-500">
              <FiAlertCircle className="text-2xl" />
            </CardDataStats>
            
            <CardDataStats loading={employeeLoading} title="Employee Renewals" total={`${calculateEmployeeRenewalsCount() || 0}`} color="orange-500">
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
                          <th className="pb-3 px-4">Expiry Date</th>
                          <th className="pb-3 px-4">Status</th>
                          <th className="pb-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companies?.slice(0, 5).map(({ id, name, expiryDate, docs, status }, key) => (
                          <tr 
                            key={key} 
                            className="group border-b border-slate-100 transition-colors hover:bg-slate-50/50 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/50"
                          >
                            <td className="py-4 pl-4">
                              <div className="flex flex-col">
                                <h5 className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                                  {name}
                                </h5>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{docs} Documents</p>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                              {expiryDate}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={clsx(
                                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                                  status === "valid" ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20" : 
                                  status === "expired" ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20" : 
                                  status === "renewal" ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20" : 
                                  "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20"
                                )}
                              >
                                {status}
                              </span>
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
                        href="/"
                        className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50"
                        key={key}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={clsx(
                              "h-2.5 w-2.5 rounded-full ring-4",
                              employee.status === "renewal" ? "bg-amber-500 ring-amber-100 dark:ring-amber-900/30" : 
                              employee.status === "expired" ? "bg-rose-500 ring-rose-100 dark:ring-rose-900/30" : 
                              employee.status === "valid" ? "bg-emerald-500 ring-emerald-100 dark:ring-emerald-900/30" : 
                              "bg-slate-400 ring-slate-100 dark:ring-slate-800"
                            )}
                          ></div>
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
                                {employee.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {employee.docs !== 0 && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <span className="text-xs font-bold text-center">
                              {employee.docs}
                            </span>
                          </div>
                        )}
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
