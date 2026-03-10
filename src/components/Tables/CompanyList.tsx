"use client"
import axios from "axios";
import Link from "next/link"
import ConfirmationModal from "../Modals/ConfirmationModal";
import { useState } from "react";
import { TCompanyList } from "@/types/types";
import SkeletonList from "../common/SkeletonList";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCompanies } from "@/libs/queries";
import toast from "react-hot-toast";
import { FiEye, FiTrash2 } from "react-icons/fi";
import clsx from "clsx";

function CompanyList({ sort }: { sort?: string }) {

    const queryClient = useQueryClient();
    const { data: companies, isLoading: companyLoading, isError: companyError } = useQuery<TCompanyList[] | null>({ queryKey: ["companies"], queryFn: fetchCompanies });

    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

    const deleteMutation = useMutation({
        mutationFn: (id: string) => {
            return axios.delete(`/api/company/${id}`);
        },
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
        }
    });

    const handleDelete = (id: string) => {
        setSelectedCompanyId(id);
        setIsConfirmationOpen(true);
    }

    const confirmDelete = async () => {
        if (selectedCompanyId) {
            deleteMutation.mutate(selectedCompanyId);
            setIsConfirmationOpen(false);
        }
    }

    const cancelDelete = () => {
        setSelectedCompanyId(null);
        setIsConfirmationOpen(false);
    }

    if (companyError) { toast.error("Failed to fetch companies") }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <ConfirmationModal
                isOpen={isConfirmationOpen}
                message="Are you sure you want to delete this company?"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            
            {companyLoading ? (
                <>
                    <div className="flex bg-slate-50 text-left dark:bg-slate-800/50 justify-around font-medium text-slate-800 dark:text-slate-200 mt-4 rounded-t-lg">
                        <div className="min-w-[220px] px-4 py-4 xl:pl-11">Name</div>
                        <div className="min-w-[150px] px-4 py-4">Expiry Date</div>
                        <div className="min-w-[120px] px-4 py-4">Status</div>
                        <div className="px-4 py-4">Actions</div>
                    </div>
                    <SkeletonList />
                </>
            ) : (
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full text-left mt-2">
                        <thead>
                            <tr className="border-b border-slate-200 text-sm font-semibold tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                <th className="pb-3 pl-4 min-w-[220px]">
                                    Name
                                </th>
                                <th className="pb-3 px-4 min-w-[150px]">
                                    Expiry Date
                                </th>
                                <th className="pb-3 px-4 min-w-[120px]">
                                    Status
                                </th>
                                <th className="pb-3 px-4 text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies?.map(({ id, name, expiryDate, docs, status }, key) => (
                                <tr 
                                  key={key}
                                  className="group border-b border-slate-100 transition-colors hover:bg-slate-50/50 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/50"
                                >
                                    <td className="py-4 pl-4">
                                        <Link href={sort === "a" ? `/accounts/transactions/company/${id}` : `/company/${id}`}>  
                                            <div className="flex flex-col">
                                                <h5 className="font-semibold capitalize text-slate-800 group-hover:text-primary dark:text-slate-200 transition-colors">
                                                    {name}
                                                </h5>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{docs} Documents</p>
                                            </div>
                                        </Link>
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
            )}
        </div>
    )
}

export default CompanyList
