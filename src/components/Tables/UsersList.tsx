"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { formatDate } from "@/utils/dateUtils";
import { useUserContext } from "@/contexts/UserContext";
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiUserCheck, FiUserX, FiShield, FiUser } from "react-icons/fi";
import clsx from "clsx";

interface User {
    _id: string;
    username: string;
    fullname: string;
    role: "partner" | "employee";
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    published?: boolean;
}

interface Pagination {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasMore: boolean;
}

const UsersList = () => {
    const router = useRouter();
    const { user: currentUser } = useUserContext();
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        currentPage: 0,
        totalPages: 0,
        totalUsers: 0,
        hasMore: false
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [showDeleted, setShowDeleted] = useState(false);

    const fetchUsers = async (page: number = 0, search: string = "", deleted: boolean = false) => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10"
            });

            if (search) {
                params.append("search", search);
            }

            if (deleted) {
                params.append("deleted", "true");
            }

            const { data } = await axios.get(`/api/users?${params}`);
            setUsers(data.users);
            setPagination(data.pagination);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Failed to fetch users";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(currentPage, searchTerm, showDeleted);
    }, [currentPage, searchTerm, showDeleted]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(0);
    };

    const handleTabChange = (deleted: boolean) => {
        setShowDeleted(deleted);
        setCurrentPage(0);
        setSearchTerm("");
    };

    const handleDelete = async (userId: string, username: string, userRole: "partner" | "employee") => {
        const isPartnerOperation = currentUser?.role === "partner" && userRole === "partner";

        let confirmationMessage = `Are you sure you want to delete user "${username}"? The user will be moved to the deleted users section and can be reactivated later.`;

        if (isPartnerOperation) {
            confirmationMessage = `⚠️ PARTNER OPERATION WARNING ⚠️\n\nYou are about to delete another PARTNER: "${username}"\n\nThis is a sensitive operation that will:\n- Remove their partner-level access\n- Move them to deleted users section\n- They can be reactivated later\n\nAre you absolutely sure you want to proceed?`;
        }

        if (!confirm(confirmationMessage)) {
            return;
        }

        if (isPartnerOperation) {
            if (!confirm(`FINAL CONFIRMATION: Delete partner "${username}"?\n\nType "DELETE" in the next prompt to confirm.`)) {
                return;
            }
            const finalConfirm = prompt(`To delete partner "${username}", please type: DELETE`);
            if (finalConfirm !== "DELETE") {
                toast.error("Operation cancelled - incorrect confirmation");
                return;
            }
        }

        try {
            await axios.delete(`/api/users/${userId}`);
            toast.success("User deleted successfully");
            fetchUsers(currentPage, searchTerm, showDeleted);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Failed to delete user";
            toast.error(errorMessage);
        }
    };

    const handleReactivate = async (userId: string, username: string, userRole: "partner" | "employee") => {
        const isPartnerOperation = currentUser?.role === "partner" && userRole === "partner";

        let confirmationMessage = `Are you sure you want to reactivate user "${username}"?`;

        if (isPartnerOperation) {
            confirmationMessage = `⚠️ PARTNER REACTIVATION ⚠️\n\nYou are about to reactivate PARTNER: "${username}"\n\nThis will restore their full partner-level access and privileges.\n\nAre you sure you want to proceed?`;
        }

        if (!confirm(confirmationMessage)) {
            return;
        }

        try {
            await axios.put(`/api/users/${userId}/reactivate`);
            toast.success("User reactivated successfully");
            fetchUsers(currentPage, searchTerm, showDeleted);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Failed to reactivate user";
            toast.error(errorMessage);
        }
    };

    const goToPage = (page: number) => {
        if (page >= 0 && page < pagination.totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="space-y-6">
            
            {/* Header & Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FiShield className="text-emerald-500" /> User Directory
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Manage all platform users, their roles, and system access.
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <FiSearch />
                        </span>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                    {!showDeleted && (
                        <Link
                            href="/users/add"
                            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-emerald-500/30"
                        >
                            <FiPlus className="text-lg" />
                            Add User
                        </Link>
                    )}
                </div>
            </div>

            {/* Main Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50 dark:ring-slate-800/50">
                
                {/* Tabs */}
                <div className="border-b border-slate-200 bg-slate-50/50 px-6 pt-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <nav className="flex space-x-6">
                        <button
                            onClick={() => handleTabChange(false)}
                            className={clsx(
                                "flex items-center gap-2 border-b-2 pb-4 text-sm font-semibold transition-colors",
                                !showDeleted 
                                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400" 
                                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            )}
                        >
                            <FiUserCheck className="text-lg" /> Active Users
                            {!showDeleted && pagination.totalUsers > 0 && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                                    {pagination.totalUsers}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange(true)}
                            className={clsx(
                                "flex items-center gap-2 border-b-2 pb-4 text-sm font-semibold transition-colors",
                                showDeleted 
                                    ? "border-rose-500 text-rose-600 dark:border-rose-400 dark:text-rose-400" 
                                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            )}
                        >
                            <FiUserX className="text-lg" /> Deleted
                            {showDeleted && pagination.totalUsers > 0 && (
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                                    {pagination.totalUsers}
                                </span>
                            )}
                        </button>
                    </nav>
                </div>

                {/* Table */}
                <div className="w-full overflow-x-auto custom-scrollbar">
                    <table className="w-full whitespace-nowrap text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 w-1/4">User Profile</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 w-1/4">Full Name</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 w-[15%]">Role</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 w-[15%]">{showDeleted ? "Deleted On" : "Date Created"}</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right w-[10%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {isLoading && users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-t-transparent"></div>
                                            <p className="font-medium">Loading directory...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                                                <FiUser className="text-3xl text-slate-400" />
                                            </div>
                                            <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                                                {searchTerm ? `No users matching "${searchTerm}"` : `No ${showDeleted ? 'deleted' : 'active'} users found`}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr 
                                        key={user._id} 
                                        className={clsx(
                                            "group transition-colors",
                                            showDeleted ? "bg-slate-50/50 dark:bg-slate-900/30 opacity-80" : "hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                                        )}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                    <span className="font-bold uppercase tracking-wider">{user.username.charAt(0)}{user.username.charAt(1)}</span>
                                                </div>
                                                <div>
                                                    <span className="block font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{user.username}</span>
                                                    {showDeleted && (
                                                        <span className="mt-0.5 inline-flex items-center rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-inset ring-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                                                            Archived
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 truncate">
                                            {user.fullname || "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold capitalize ring-1 ring-inset",
                                                user.role === 'partner' 
                                                    ? "bg-teal-50 text-teal-700 ring-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300" 
                                                    : "bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                                            )}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            {showDeleted 
                                                ? (user.deletedAt ? formatDate(user.deletedAt) : "N/A") 
                                                : formatDate(user.createdAt)
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {showDeleted ? (
                                                    <button
                                                        onClick={() => handleReactivate(user._id, user.username, user.role)}
                                                        className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                                                        title="Reactivate User"
                                                    >
                                                        <FiRefreshCw className="text-sm" /> Reactivate
                                                    </button>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={`/users/${user._id}/edit`}
                                                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                                                            title="Edit Details"
                                                        >
                                                            <FiEdit2 className="text-lg" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(user._id, user.username, user.role)}
                                                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                                                            title="Delete / Archive"
                                                        >
                                                            <FiTrash2 className="text-lg" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Showing <span className="font-bold text-slate-900 dark:text-white">{currentPage * 10 + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min((currentPage + 1) * 10, pagination.totalUsers)}</span> of <span className="font-bold text-slate-900 dark:text-white">{pagination.totalUsers}</span> users
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 0}
                                className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                            >
                                Prev
                            </button>
                            <div className="hidden sm:flex gap-1">
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    const pageNum = Math.max(0, Math.min(pagination.totalPages - 5, currentPage - 2)) + i;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => goToPage(pageNum)}
                                            className={clsx(
                                                "min-w-[32px] rounded-xl px-2 py-1.5 text-sm font-semibold shadow-sm transition-colors",
                                                pageNum === currentPage
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                                            )}
                                        >
                                            {pageNum + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= pagination.totalPages - 1}
                                className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsersList;
