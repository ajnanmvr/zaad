import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Plus, Users, Shield, UserCog, User, Eye, Edit, Trash2 } from "lucide-react";
import type { IUser } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { SortableTable } from "@/components/ui/sortable-table";
import type { ColumnDef } from "@/components/ui/sortable-table";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Pagination } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

export default function UserList() {
    const { users, deleteUser } = useStore();
    const navigate = useNavigate();
    const [deleteItem, setDeleteItem] = useState<IUser | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const partners = users.filter((u: IUser) => u.role === 'partner').length;
    const employees = users.filter((u: IUser) => u.role === 'employee').length;

    const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
    const paginatedUsers = users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const columns: ColumnDef<IUser>[] = [
        { key: "name", header: "Name", sortable: true, className: "font-medium" },
        { key: "email", header: "Username / Email", sortable: true },
        {
            key: "role",
            header: "Role",
            sortable: true,
            render: (u: IUser) => (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${u.role === 'partner' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                    {u.role === 'partner' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                </span>
            )
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            render: (u: IUser) => <span className={`text-xs font-bold uppercase ${u.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-slate-400'}`}>{u.status}</span>
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (u: IUser) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/users/${u._id}`);
                        }}
                        title="View details"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/users/${u._id}/edit`);
                        }}
                        title="Edit user"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteItem(u);
                        }}
                        title="Delete user"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <Shield className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                        User Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage user accounts and access control (RBAC)</p>
                </div>
                <Button onClick={() => navigate("/users/new")}>
                    <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Users</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{users.length}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-900">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Partners</p>
                            <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-300">{partners}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Employees</p>
                            <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">{employees}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* User Table */}
                <div className="lg:col-span-2">
                    <div className="rounded-md border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800">
                        <SortableTable data={paginatedUsers} columns={columns} />
                    </div>
                    {totalPages > 1 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                itemsPerPage={ITEMS_PER_PAGE}
                                totalItems={users.length}
                            />
                        </div>
                    )}
                </div>

                {/* RBAC Info */}
                <div className="space-y-6">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Role-Based Access Control (RBAC)</h3>

                    <Card className="border-l-4 border-l-purple-500 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-purple-700 dark:text-purple-400">
                                <Shield className="w-4 h-4" /> Partner Role
                            </div>
                            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                                <li>Full access to all modules</li>
                                <li>Can manage users and permissions</li>
                                <li>View financial reports and analytics</li>
                                <li>Edit and delete all records</li>
                                <li>Configure system settings</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400">
                                <UserCog className="w-4 h-4" /> Employee Role
                            </div>
                            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                                <li>Create and edit records</li>
                                <li>Generate invoices and quotations</li>
                                <li>Manage tasks assigned to them</li>
                                <li>View company and employee data</li>
                                <li>Limited financial access</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <DeleteConfirmationDialog
                open={!!deleteItem}
                title="Delete User"
                itemName={deleteItem?.name}
                description={`Are you sure you want to delete user "${deleteItem?.name}"? This action cannot be undone.`}
                onConfirm={() => {
                    if (deleteItem) {
                        deleteUser(deleteItem._id);
                        setDeleteItem(null);
                    }
                }}
                onCancel={() => setDeleteItem(null)}
            />
        </div>
    );
}
