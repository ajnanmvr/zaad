import { useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Briefcase, Mail, Eye, Edit, Trash2 } from "lucide-react";
import { SortableTable } from "@/components/ui/sortable-table";
import type { ColumnDef } from "@/components/ui/sortable-table";
import { useState } from "react";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Pagination } from "@/components/ui/pagination";
import type { IEmployee } from "@/types";

const ITEMS_PER_PAGE = 10;

export default function EmployeeList() {
    const navigate = useNavigate();
    const { employees, companies, deleteEmployee } = useStore();
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteItem, setDeleteItem] = useState<IEmployee | null>(null);

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email?.toLowerCase().includes(search.toLowerCase()) ||
        e.designation?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const columns: ColumnDef<IEmployee>[] = [
        {
            key: "name",
            header: "Employee",
            sortable: true,
            render: (d: IEmployee) => (
                <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                        {d.name.substring(0, 2).toUpperCase()}
                    </div>
                    {d.name}
                </div>
            )
        },
        {
            key: "company",
            header: "Company",
            sortable: true,
            render: (d: IEmployee) => {
                const comp = companies.find(c => c._id === d.company);
                return (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Briefcase className="w-4 h-4" />
                        {comp?.name || "Unknown"}
                    </div>
                )
            }
        },
        {
            key: "designation",
            header: "Designation",
            sortable: true,
            render: (d: IEmployee) => <span className="text-slate-600 dark:text-slate-400">{d.designation}</span>
        },
        {
            key: "email",
            header: "Contact",
            sortable: false,
            render: (d: IEmployee) => (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 text-xs">
                    <Mail className="w-3.5 h-3.5" />
                    {d.email}
                </div>
            )
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            render: (d: IEmployee) => (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${d.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"}`}>
                    {d.isActive ? "Active" : "Inactive"}
                </span>
            )
        },
        {
            key: "actions",
            header: "Actions",
            sortable: false,
            className: "text-right",
            render: (d: IEmployee) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/employees/${d._id}`);
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
                            navigate(`/employees/${d._id}/edit`);
                        }}
                        title="Edit employee"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteItem(d);
                        }}
                        title="Delete employee"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <Users className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                        Employees
                    </h1>
                    <p className="text-slate-500 text-sm">Manage company staff and labor details</p>
                </div>
                <Button onClick={() => navigate("/employees/new")} className="bg-brand-600 hover:bg-brand-700 text-white gap-2 shadow-lg shadow-brand-500/20">
                    <Plus className="w-4 h-4" />
                    Add Employee
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Employees</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{employees.length}</h3>
                        </div>
                        <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-brand-600 dark:text-brand-400">
                            <Users className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search employees..."
                        className="pl-9 bg-white dark:bg-slate-900"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <SortableTable
                    data={paginatedEmployees}
                    columns={columns}
                    onRowClick={(item) => navigate(`/employees/${item._id}`)}
                />
            </div>

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={filteredEmployees.length}
                />
            )}

            <DeleteConfirmationDialog
                open={!!deleteItem}
                title="Delete Employee"
                itemName={deleteItem?.name}
                description={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
                onConfirm={() => {
                    if (deleteItem) {
                        deleteEmployee(deleteItem._id);
                        setDeleteItem(null);
                    }
                }}
                onCancel={() => setDeleteItem(null)}
            />
        </div>
    );
}
