import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SortableTable } from "@/components/ui/sortable-table";
import type { ColumnDef } from "@/components/ui/sortable-table";
import { Plus, Search, DollarSign, Eye, Edit, Trash2 } from "lucide-react";
import type { IRecord, ICompany, IEmployee, IIndividual } from "@/types";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Pagination } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

export default function RecordList() {
    const records: any[] = [];
    const companies: any[] = [];
    const employees: any[] = [];
    const individuals: any[] = [];
    const deleteRecord = (id: string) => console.log('Delete record:', id);
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
    const [deleteItem, setDeleteItem] = useState<IRecord | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const filteredRecords = records.filter((rec: IRecord) => {
        const matchesSearch = rec.particular?.toLowerCase().includes(search.toLowerCase()) || false;
        const matchesType = typeFilter === "all" || rec.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
    const paginatedRecords = filteredRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const columns: ColumnDef<IRecord>[] = [
        { key: "particular", header: "Particulars", sortable: true },
        {
            key: "type",
            header: "Type",
            sortable: true,
            render: (item: IRecord) => (
                <span className={`capitalize font-medium ${item.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                    {item.type}
                </span>
            )
        },
        {
            key: "client",
            header: "Client",
            sortable: false,
            render: (item: IRecord) => {
                const employee = item.employee ? employees.find((e: IEmployee) => e._id === item.employee) : null;
                const company = item.company ? companies.find((c: ICompany) => c._id === item.company) : null;
                const individual = item.individual ? individuals.find((i: IIndividual) => i._id === item.individual) : null;
                
                if (employee) {
                    const empCompany = employee.company ? companies.find((c: ICompany) => c._id === employee.company) : null;
                    return (
                        <div className="text-sm">
                            <div className="font-medium text-slate-900 dark:text-slate-100">{employee.name}</div>
                            {empCompany && <div className="text-xs text-slate-500 dark:text-slate-400">({empCompany.name})</div>}
                        </div>
                    );
                }
                if (company) {
                    return <div className="font-medium text-slate-900 dark:text-slate-100">{company.name}</div>;
                }
                if (individual) {
                    return <div className="font-medium text-slate-900 dark:text-slate-100">{individual.name}</div>;
                }
                return <span className="text-slate-400">-</span>;
            }
        },
        { key: "method", header: "Method", sortable: true, className: "capitalize" },
        {
            key: "amount",
            header: "Amount",
            sortable: true,
            className: "text-right font-bold",
            render: (item: IRecord) => (
                <span className={item.type === "income" ? "text-emerald-600" : "text-red-600"}>
                    {item.type === "income" ? "+" : "-"} {item.amount.toLocaleString()}
                </span>
            )
        },
        {
            key: "createdAt",
            header: "Date",
            sortable: true,
            render: (item: IRecord) => item.createdAt ? item.createdAt.split("T")[0] : "-"
        },
        {
            key: "actions",
            header: "Actions",
            render: (item: IRecord) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/records/${item._id}`);
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
                            navigate(`/records/${item._id}/edit`);
                        }}
                        title="Edit record"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteItem(item);
                        }}
                        title="Delete record"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <DollarSign className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                        Records
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Track all income and expenses.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate("/records/new?type=expense")}>
                        Add Expense
                    </Button>
                    <Button onClick={() => navigate("/records/new?type=income")}>
                        <Plus className="mr-2 h-4 w-4" /> Add Income
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <Input
                        placeholder="Search records..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <select
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={typeFilter}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === "all" || value === "income" || value === "expense") {
                            setTypeFilter(value);
                        }
                    }}
                >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
            </div>

            <div className="rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <SortableTable
                    data={paginatedRecords}
                    columns={columns}
                />
                {paginatedRecords.length === 0 && (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <DollarSign className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                        <p className="font-medium">No records found</p>
                    </div>
                )}
                {totalPages > 1 && (
                    <div className="border-t border-slate-200 dark:border-slate-800 p-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            itemsPerPage={ITEMS_PER_PAGE}
                            totalItems={filteredRecords.length}
                        />
                    </div>
                )}
            </div>

            <DeleteConfirmationDialog
                open={!!deleteItem}
                title="Delete Record"
                itemName={deleteItem?.particular}
                description={`Are you sure you want to delete this record? This action cannot be undone.`}
                onConfirm={() => {
                    if (deleteItem) {
                        deleteRecord(deleteItem._id);
                        setDeleteItem(null);
                    }
                }}
                onCancel={() => setDeleteItem(null)}
            />
        </div>
    );
}
