import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SortableTable } from "@/components/ui/sortable-table";
import type { ColumnDef } from "@/components/ui/sortable-table";
import { Plus, TrendingUp, DollarSign, Eye, Edit, Trash2, Wallet } from "lucide-react";
import type { IZaadExpense } from "@/types";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Pagination } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

export default function ZaadExpensesList() {
    const { zaadExpenses, deleteZaadExpense } = useStore();
    const navigate = useNavigate();
    const [deleteItem, setDeleteItem] = useState<IZaadExpense | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Stats (Mock calculation for now, can be real later)
    const totalThisMonth = zaadExpenses.reduce((acc, curr: IZaadExpense) => acc + curr.amount, 0);
    const lastMonth = 38500; // Mock
    const average = 39850; // Mock

    const totalPages = Math.ceil(zaadExpenses.length / ITEMS_PER_PAGE);
    const paginatedExpenses = zaadExpenses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const columns: ColumnDef<IZaadExpense>[] = [
        { key: "date", header: "Date", sortable: true, render: (i) => i.date?.split('T')[0] || '' },
        { key: "title", header: "Title", sortable: true, className: "font-medium" },
        {
            key: "category",
            header: "Category",
            sortable: true,
            render: (i) => <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium">{i.category}</span>
        },
        {
            key: "amount",
            header: "Amount",
            sortable: true,
            className: "text-right font-bold",
            render: (i) => `AED ${i.amount.toLocaleString()}`
        },
        {
            key: "actions",
            header: "Actions",
            render: (item: IZaadExpense) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/zaad-expenses/${item._id}`);
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
                            navigate(`/zaad-expenses/${item._id}/edit`);
                        }}
                        title="Edit expense"
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
                        title="Delete expense"
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
                        <Wallet className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                        Zaad Office Expenses
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Track company operational expenses</p>
                </div>
                <Button onClick={() => navigate("/zaad-expenses/new")}>
                    <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-brand-200 bg-brand-50 dark:bg-brand-900/10 dark:border-brand-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-brand-900 dark:text-brand-300">Total Expenses</CardTitle>
                        <DollarSign className="h-4 w-4 text-brand-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-700 dark:text-brand-400">AED {totalThisMonth.toLocaleString()}</div>
                        <p className="text-xs text-brand-600/80 flex items-center mt-1">
                            <TrendingUp className="w-3 h-3 mr-1" /> All time
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Last Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">AED {lastMonth.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Average Monthly</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">AED {average.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                {/* Categories */}
                <div className="md:col-span-1 space-y-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Expenses by Category</h3>
                    <div className="space-y-3">
                        <CategoryBar label="Rent" amount={15000} total={totalThisMonth} color="bg-blue-500" />
                        <CategoryBar label="Payroll" amount={25000} total={totalThisMonth} color="bg-emerald-500" />
                        <CategoryBar label="Utilities" amount={1200} total={totalThisMonth} color="bg-orange-500" />
                    </div>
                </div>

                {/* Table */}
                <div className="md:col-span-3">
                    <div className="rounded-md border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800">
                        <SortableTable data={paginatedExpenses} columns={columns} />
                    </div>
                    {totalPages > 1 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                itemsPerPage={ITEMS_PER_PAGE}
                                totalItems={zaadExpenses.length}
                            />
                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmationDialog
                open={!!deleteItem}
                title="Delete Expense"
                itemName={deleteItem?.title}
                description={`Are you sure you want to delete this expense? This action cannot be undone.`}
                onConfirm={() => {
                    if (deleteItem) {
                        deleteZaadExpense(deleteItem._id);
                        setDeleteItem(null);
                    }
                }}
                onCancel={() => setDeleteItem(null)}
            />
        </div>
    )
}

interface CategoryBarProps {
    label: string;
    amount: number;
    total: number;
    color: string;
}

function CategoryBar({ label, amount, total, color }: CategoryBarProps) {
    const pct = total > 0 ? (amount / total) * 100 : 0;
    return (
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-slate-500 font-medium">{label}</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">AED {amount.toLocaleString()}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}
