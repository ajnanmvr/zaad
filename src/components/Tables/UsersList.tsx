"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { formatDate } from "@/utils/dateUtils";
import { useUserContext } from "@/contexts/UserContext";
import {
    deleteUserAction,
    listUsersAction,
    reactivateUserAction,
} from "@/actions/users";

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

            const data = await listUsersAction({
                search,
                page,
                limit: 10,
                showDeleted: deleted,
            });
            setUsers(data.users as any);
            setPagination(data.pagination as any);
        } catch (error: any) {
            const errorMessage = error?.message || "Failed to fetch users";
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
        setCurrentPage(0); // Reset to first page when searching
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

        // Additional confirmation for partner operations
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
            await deleteUserAction(userId);
            toast.success("User deleted successfully");
            fetchUsers(currentPage, searchTerm, showDeleted);
        } catch (error: any) {
            const errorMessage = error?.message || "Failed to delete user";
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
            await reactivateUserAction(userId);
            toast.success("User reactivated successfully");
            fetchUsers(currentPage, searchTerm, showDeleted);
        } catch (error: any) {
            const errorMessage = error?.message || "Failed to reactivate user";
            toast.error(errorMessage);
        }
    };

    const getRoleBadge = (role: string) => {
        const baseClasses = "inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium";

        if (role === "partner") {
            return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
        } else {
            return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
        }
    };

    const goToPage = (page: number) => {
        if (page >= 0 && page < pagination.totalPages) {
            setCurrentPage(page);
        }
    };

    if (isLoading && users.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            {/* Header */}
            <div className="px-4 py-6 md:px-6 xl:px-7.5">
                <div className="flex items-center justify-between">
                    <h4 className="text-xl font-semibold text-black dark:text-white">
                        Users Management
                    </h4>
                    {!showDeleted && (
                        <Link
                            href="/users/add"
                            className="inline-flex items-center justify-center rounded bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90"
                        >
                            Add User
                        </Link>
                    )}
                </div>

                {/* Tabs */}
                <div className="mt-4 border-b border-stroke dark:border-strokedark">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => handleTabChange(false)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${!showDeleted
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            Active Users
                            {!showDeleted && pagination.totalUsers > 0 && (
                                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs dark:bg-gray-700 dark:text-gray-300">
                                    {pagination.totalUsers}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange(true)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${showDeleted
                                ? 'border-red-500 text-red-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            Deleted Users
                            {showDeleted && pagination.totalUsers > 0 && (
                                <span className="ml-2 bg-red-100 text-red-900 py-0.5 px-2.5 rounded-full text-xs dark:bg-red-900 dark:text-red-300">
                                    {pagination.totalUsers}
                                </span>
                            )}
                        </button>
                    </nav>
                </div>

                {/* Search */}
                <div className="mt-4">
                    <input
                        type="text"
                        placeholder={`Search ${showDeleted ? 'deleted' : 'active'} users...`}
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full max-w-sm rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                            <th className="px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                                Username
                            </th>
                            <th className="px-4 py-4 font-medium text-black dark:text-white">
                                Full Name
                            </th>
                            <th className="px-4 py-4 font-medium text-black dark:text-white">
                                Role
                            </th>
                            <th className="px-4 py-4 font-medium text-black dark:text-white">
                                {showDeleted ? "Deleted On" : "Created"}
                            </th>
                            <th className="px-4 py-4 font-medium text-black dark:text-white">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center px-4 py-8 text-gray-500 dark:text-gray-400">
                                    {searchTerm
                                        ? `No ${showDeleted ? 'deleted' : 'active'} users found matching your search.`
                                        : showDeleted
                                            ? "No deleted users found."
                                            : "No users found."
                                    }
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user._id} className={`border-t border-stroke dark:border-strokedark ${showDeleted ? 'opacity-75 bg-gray-50 dark:bg-gray-800' : ''}`}>
                                    <td className="px-4 py-4 pl-9 xl:pl-11">
                                        <div className="flex items-center">
                                            <p className={`font-medium ${showDeleted ? 'text-gray-600 dark:text-gray-400' : 'text-black dark:text-white'}`}>
                                                {user.username}
                                            </p>
                                            {showDeleted && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                    Deleted
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className={showDeleted ? 'text-gray-600 dark:text-gray-400' : 'text-black dark:text-white'}>
                                            {user.fullname || "—"}
                                        </p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`${getRoleBadge(user.role)} ${showDeleted ? 'opacity-75' : ''}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className={showDeleted ? 'text-gray-600 dark:text-gray-400' : 'text-black dark:text-white'}>
                                            {showDeleted
                                                ? (user.deletedAt ? formatDate(user.deletedAt) : "N/A")
                                                : formatDate(user.createdAt)
                                            }
                                        </p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center space-x-2">
                                            {showDeleted ? (
                                                <button
                                                    onClick={() => handleReactivate(user._id, user.username, user.role)}
                                                    className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    title="Reactivate user"
                                                >
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Reactivate
                                                </button>
                                            ) : (
                                                <>
                                                    {/* Only show edit link if not editing another partner's password */}
                                                    <Link
                                                        href={`/users/${user._id}/edit`}
                                                        className="hover:text-primary"
                                                        title="Edit user"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(user._id, user.username, user.role)}
                                                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                                                        title="Delete user"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </>
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
                <div className="flex items-center justify-between px-6 py-4 border-t border-stroke dark:border-strokedark">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, pagination.totalUsers)} of {pagination.totalUsers} {showDeleted ? 'deleted' : 'active'} users
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 0}
                            className="px-3 py-1 border border-stroke rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark"
                        >
                            Previous
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const pageNum = Math.max(0, Math.min(pagination.totalPages - 5, currentPage - 2)) + i;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => goToPage(pageNum)}
                                    className={`px-3 py-1 border rounded ${pageNum === currentPage
                                        ? "bg-primary text-white border-primary"
                                        : "border-stroke hover:bg-gray-50 dark:border-strokedark dark:hover:bg-boxdark"
                                        }`}
                                >
                                    {pageNum + 1}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage >= pagination.totalPages - 1}
                            className="px-3 py-1 border border-stroke rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersList;