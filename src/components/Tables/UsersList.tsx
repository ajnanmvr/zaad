"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { formatDate } from "@/utils/dateUtils";

interface User {
    _id: string;
    username: string;
    fullname: string;
    role: "partner" | "employee";
    createdAt: string;
}

interface Pagination {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasMore: boolean;
}

const UsersList = () => {
    const router = useRouter();
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

    const fetchUsers = async (page: number = 0, search: string = "") => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10"
            });

            if (search) {
                params.append("search", search);
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
        fetchUsers(currentPage, searchTerm);
    }, [currentPage, searchTerm]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(0); // Reset to first page when searching
    };

    const handleDelete = async (userId: string, username: string) => {
        if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await axios.delete(`/api/users/${userId}`);
            toast.success("User deleted successfully");
            fetchUsers(currentPage, searchTerm);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Failed to delete user";
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
                    <Link
                        href="/users/add"
                        className="inline-flex items-center justify-center rounded bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90"
                    >
                        Add User
                    </Link>
                </div>

                {/* Search */}
                <div className="mt-4">
                    <input
                        type="text"
                        placeholder="Search users..."
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
                                Created
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
                                    {searchTerm ? "No users found matching your search." : "No users found."}
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user._id} className="border-t border-stroke dark:border-strokedark">
                                    <td className="px-4 py-4 pl-9 xl:pl-11">
                                        <p className="font-medium text-black dark:text-white">
                                            {user.username}
                                        </p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-black dark:text-white">
                                            {user.fullname || "—"}
                                        </p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={getRoleBadge(user.role)}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-black dark:text-white">
                                            {formatDate(user.createdAt)}
                                        </p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center space-x-2">
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
                                                onClick={() => handleDelete(user._id, user.username)}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400"
                                                title="Delete user"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
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
                        Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, pagination.totalUsers)} of {pagination.totalUsers} users
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