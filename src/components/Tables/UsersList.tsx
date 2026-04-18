"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import clsx from "clsx";
import {
  FiArchive,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import ConfirmationModal from "../Modals/ConfirmationModal";
import ExportActionsMenu from "../common/ExportActionsMenu";
import { formatDate } from "@/utils/dateUtils";
import { exportRowsCsv, exportRowsExcel, exportRowsPdf } from "@/utils/exportTableData";

interface User {
  _id: string;
  username: string;
  fullname: string;
  role: string;
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

type UserSort =
  | "newest"
  | "oldest"
  | "username-asc"
  | "username-desc"
  | "fullname-asc"
  | "fullname-desc";

const UsersList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<UserSort>("newest");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    action: "delete" | "reactivate";
    userId: string;
    username: string;
  } | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["users", currentPage, pageSize, searchTerm, showDeleted, roleFilter, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
      });

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      if (roleFilter !== "all") {
        params.append("role", roleFilter);
      }

      if (showDeleted) {
        params.append("deleted", "true");
      }

      const { data } = await axios.get(`/api/users?${params.toString()}`);
      return data as { users: User[]; pagination: Pagination };
    },
    placeholderData: keepPreviousData,
  });

  const users = useMemo(() => data?.users || [], [data?.users]);
  const pagination =
    data?.pagination ||
    ({
      currentPage: 0,
      totalPages: 0,
      totalUsers: 0,
      hasMore: false,
    } as Pagination);

  const roleDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    users.forEach((item) => {
      counts.set(item.role, (counts.get(item.role) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [users]);

  const uniqueRoles = useMemo(
    () => Array.from(new Set(users.map((item) => item.role))).sort((a, b) => a.localeCompare(b)),
    [users],
  );

  const allSelected = users.length > 0 && users.every((item) => selectedUserIds.includes(item._id));
  const selectedRows = users.filter((item) => selectedUserIds.includes(item._id));

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => axios.delete(`/api/users/${userId}`),
    onSuccess: () => {
      toast.success("User archived successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to archive user");
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (userId: string) => axios.put(`/api/users/${userId}/reactivate`),
    onSuccess: () => {
      toast.success("User reactivated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to reactivate user");
    },
  });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(0);
    setSelectedUserIds([]);
  };

  const handleTabChange = (deleted: boolean) => {
    setShowDeleted(deleted);
    setCurrentPage(0);
    setSelectedUserIds([]);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(0);
    setSelectedUserIds([]);
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(0);
    setSelectedUserIds([]);
  };

  const handleSortChange = (value: UserSort) => {
    setSortBy(value);
    setCurrentPage(0);
    setSelectedUserIds([]);
  };

  const confirmAction = () => {
    if (!confirmState) return;

    if (confirmState.action === "delete") {
      deleteMutation.mutate(confirmState.userId);
    } else {
      reactivateMutation.mutate(confirmState.userId);
    }

    setConfirmState(null);
  };

  const goToPage = (page: number) => {
    if (page < 0 || page >= pagination.totalPages) return;
    setCurrentPage(page);
    setSelectedUserIds([]);
  };

  const startRow = pagination.totalUsers === 0 ? 0 : currentPage * pageSize + 1;
  const endRow = Math.min((currentPage + 1) * pageSize, pagination.totalUsers);

  const mapExportRows = (rows: User[]) =>
    rows.map((item) => ({
      Username: item.username,
      FullName: item.fullname || "",
      Role: item.role,
      Status: showDeleted ? "archived" : "active",
      CreatedAt: formatDate(item.createdAt),
      ArchivedAt: showDeleted ? formatDate(item.deletedAt || "") : "",
    }));

  const exportSelection = async (format: "csv" | "excel" | "pdf", mode: "selected" | "all") => {
    const sourceRows = mode === "selected" ? selectedRows : users;
    const rows = mapExportRows(sourceRows);

    if (!rows.length) {
      toast.error(mode === "selected" ? "Select users first" : "No users to export");
      return;
    }

    const fileName = showDeleted ? "users-archived" : "users-active";

    if (format === "csv") {
      exportRowsCsv(rows, fileName);
    } else if (format === "excel") {
      exportRowsExcel(rows, fileName);
    } else {
      await exportRowsPdf(rows, fileName);
    }

    toast.success(`${mode === "selected" ? "Selected" : "Visible"} users exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={Boolean(confirmState)}
        title={confirmState?.action === "delete" ? "Archive User" : "Reactivate User"}
        message={
          confirmState?.action === "delete"
            ? `Archive user "${confirmState?.username}"?`
            : `Reactivate user "${confirmState?.username}"?`
        }
        confirmLabel={confirmState?.action === "delete" ? "Archive" : "Reactivate"}
        cancelLabel="Cancel"
        variant={confirmState?.action === "delete" ? "warning" : "primary"}
        isLoading={deleteMutation.isPending || reactivateMutation.isPending}
        onCancel={() => setConfirmState(null)}
        onConfirm={confirmAction}
      />

      <section className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-5 shadow-sm dark:border-emerald-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-300">
              <FiUsers />
              Administration
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              System Users
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Manage user access, role assignments, and account lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Visible Users</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{users.length}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200/80 bg-white/80 p-4 dark:border-emerald-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Results</p>
              <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{pagination.totalUsers}</p>
            </div>
            <div className="rounded-2xl border border-cyan-200/80 bg-white/80 p-4 dark:border-cyan-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current View</p>
              <p className="mt-1 text-sm font-black text-cyan-600 dark:text-cyan-400">
                {showDeleted ? "Archived Users" : "Active Users"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              <FiUsers className="text-emerald-500" />
              User Directory
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage user access, role assignments, and account lifecycle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search by username or name"
                className="w-72 rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            {!showDeleted ? (
              <Link
                href="/users/add"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <FiPlus />
                Add User
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 p-1 dark:border-slate-700">
            <button
              onClick={() => handleTabChange(false)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-sm font-semibold",
                !showDeleted
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              Active
            </button>
            <button
              onClick={() => handleTabChange(true)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-sm font-semibold",
                showDeleted
                  ? "bg-rose-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              Archived
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {roleDistribution.slice(0, 4).map(([role, count]) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <FiShield className="text-[11px]" />
                {role}: {count}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
          <select
            value={pageSize}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            title="Rows per page"
          >
            {[10, 20, 30, 50].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) => handleSortChange(event.target.value as UserSort)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            title="Sort users"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="username-asc">Username A-Z</option>
            <option value="username-desc">Username Z-A</option>
            <option value="fullname-asc">Full Name A-Z</option>
            <option value="fullname-desc">Full Name Z-A</option>
          </select>

          <select
            value={roleFilter}
            onChange={(event) => handleRoleChange(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            title="Filter by role"
          >
            <option value="all">All Roles</option>
            {uniqueRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <div className="ml-auto">
            <ExportActionsMenu onExport={exportSelection} selectedCount={selectedRows.length} />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="w-[44px] px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all users"
                    checked={allSelected}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedUserIds(users.map((item) => item._id));
                      } else {
                        setSelectedUserIds([]);
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">User</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Full Name</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Role</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                  {showDeleted ? "Archived On" : "Created On"}
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                      <FiUser className="text-3xl text-slate-400" />
                      <p>
                        {searchTerm
                          ? `No users match "${searchTerm}"`
                          : `No ${showDeleted ? "archived" : "active"} users found.`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr
                    key={item._id}
                    className="border-t border-slate-200 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${item.username}`}
                        checked={selectedUserIds.includes(item._id)}
                        onChange={(event) => {
                          setSelectedUserIds((prev) =>
                            event.target.checked
                              ? Array.from(new Set([...prev, item._id]))
                              : prev.filter((id) => id !== item._id),
                          );
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xs font-black uppercase text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          {(item.username || "US").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{item.username}</p>
                          {showDeleted ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                              <FiArchive className="text-[10px]" />
                              archived
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.fullname || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300">
                        {item.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {showDeleted ? formatDate(item.deletedAt || "") : formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {showDeleted ? (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmState({
                                action: "reactivate",
                                userId: item._id,
                                username: item.username,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
                          >
                            <FiRefreshCw />
                            Reactivate
                          </button>
                        ) : (
                          <>
                            <Link
                              href={`/users/${item._id}/edit`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold dark:border-slate-700"
                            >
                              <FiEdit2 />
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmState({
                                  action: "delete",
                                  userId: item._id,
                                  username: item.username,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-700 dark:text-rose-300"
                            >
                              <FiTrash2 />
                              Archive
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Showing {startRow} to {endRow} of {pagination.totalUsers}
            {isFetching ? " (updating...)" : ""}
          </p>

          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold disabled:opacity-50 dark:border-slate-700"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {pagination.currentPage + 1} / {Math.max(1, pagination.totalPages)}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={!pagination.hasMore}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold disabled:opacity-50 dark:border-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersList;
