import { TEmployeeList } from "@/types/types"
import Link from "next/link"
import ConfirmationModal from "../Modals/ConfirmationModal";
import { useState } from "react";
import axios from "axios";
import SkeletonList from "../common/SkeletonList";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiEye, FiTrash2 } from "react-icons/fi";
import clsx from "clsx";

function EmployeeList({ employees, isLoading }: { employees: TEmployeeList[] | null | undefined, isLoading?: boolean }) {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: (id: string) => axios.delete(`/api/employee/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            toast.success("Employee deleted successfully");
        }, onError: () => {
            toast.error("Failed to delete employee");
        }
    });

    const handleDelete = (id: string) => {
        setSelectedEmployeeId(id);
        setIsConfirmationOpen(true);
    }

    const confirmDelete = async () => {
        if (selectedEmployeeId) {
            deleteMutation.mutate(selectedEmployeeId);
            setIsConfirmationOpen(false);
        }
    }

    const cancelDelete = () => {
        setSelectedEmployeeId(null);
        setIsConfirmationOpen(false);
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <ConfirmationModal
                isOpen={isConfirmationOpen}
                message="Are you sure you want to delete this employee?"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            <div className="max-w-full overflow-x-auto">
                {isLoading ? (
                    <>
                        <div className="mt-4 flex justify-around rounded-t-lg bg-slate-50 text-left font-medium text-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                            <div className="min-w-[220px] px-4 py-4 xl:pl-11">Name</div>
                            <div className="min-w-[150px] px-4 py-4">Expiry Date</div>
                            <div className="min-w-[120px] px-4 py-4">Status</div>
                            <div className="px-4 py-4">Actions</div>
                        </div>
                        <SkeletonList />
                    </>
                ) : (
                    <table className="mt-2 w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200 text-sm font-semibold tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                <th className="min-w-[220px] pb-3 pl-4">
                                    Name
                                </th>
                                <th className="min-w-[150px] px-4 pb-3">
                                    Expiry Date
                                </th>
                                <th className="min-w-[120px] px-4 pb-3">
                                    Status
                                </th>
                                <th className="px-4 pb-3 text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees?.map(({ id, name, expiryDate, docs, status, company }, key) => (
                                <tr 
                                    key={key}
                                    className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                                >
                                    <td className="py-4 pl-4">
                                        <div className="flex flex-col">
                                            <Link href={`/employee/${id}`}>
                                                <h5 className="font-semibold capitalize text-slate-800 transition-colors group-hover:text-primary dark:text-slate-200">
                                                    {name}
                                                </h5>
                                            </Link>
                                            <Link href={`/company/${company?._id}`} className="mt-0.5 text-xs text-slate-500 hover:text-primary hover:underline dark:text-slate-400">
                                                {company?.name}
                                            </Link>
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
                )}
            </div>
        </div>
    )
}

export default EmployeeList
