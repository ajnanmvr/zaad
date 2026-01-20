import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SortableTable } from "@/components/ui/sortable-table";
import type { ColumnDef } from "@/components/ui/sortable-table";
import { Plus, Search, ArrowUpRight, ArrowDownLeft, Eye, Edit, Trash2, Scale } from "lucide-react";
import type { ILiability } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Pagination } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

export default function LiabilityList() {
    const liabilities: any[] = [];
    const companies: any[] = [];
    const individuals: any[] = [];
    const deleteLiability = (id: string) => console.log('Delete liability:', id);
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [deleteItem, setDeleteItem] = useState<ILiability | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const filteredLiabilities = liabilities.filter((l: ILiability) =>
        l.description?.toLowerCase().includes(search.toLowerCase()) || false
    );

    const totalPages = Math.ceil(filteredLiabilities.length / ITEMS_PER_PAGE);
    const paginatedLiabilities = filteredLiabilities.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Calculations
    const totalPayable = liabilities
        .filter((l: ILiability) => l.type === 'payable' || l.type === 'loan')
        .reduce((acc, curr) => acc + (curr.amount - (curr.paidAmount || 0)), 0);

    const totalReceivable = liabilities
        .filter((l: ILiability) => l.type === 'receivable' || l.type === 'credit')
        .reduce((acc, curr) => acc + (curr.amount - (curr.paidAmount || 0)), 0);

    const getEntityName = (item: ILiability) => {
        if (item.company) return companies.find(c => c._id === item.company)?.name || "Unknown Company";
        if (item.individual) return individuals.find(i => i._id === item.individual)?.name || "Unknown Individual";
        return "-";
    };

    const columns: ColumnDef<ILiability>[] = [
        {
            key: "company",
            header: "Entity Name",
            sortable: true,
            render: (item: ILiability) => <span className="font-medium">{getEntityName(item)}</span>
        },
        {
            key: "type",
            header: "Type",
            sortable: true,
            render: (item: ILiability) => (
                <span className={`capitalize inline-flex items-center gap-1 ${['payable', 'loan'].includes(item.type) ? 'text-red-600' : 'text-emerald-600'}`}>
                    {['payable', 'loan'].includes(item.type) ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {item.type}
                </span>
            )
        },
        { key: "description", header: "Description", sortable: true, className: "max-w-xs truncate" },
        {
            key: "dueDate",
            header: "Due Date",
            sortable: true,
            render: (item: ILiability) => item.dueDate?.split('T')[0] || '-'
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            render: (item: ILiability) => (
                <span className={`capitalize text-xs px-2 py-1 rounded-full ${item.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                    item.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        item.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                    }`}>
                    {item.status}
                </span>
            )
        },
        {
            key: "amount",
            header: "Amount",
            sortable: true,
            className: "text-right font-bold",
            render: (item: ILiability) => `AED ${(item.amount).toLocaleString()}`
        },
        {
            key: "actions",
            header: "Actions",
            render: (item: ILiability) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/liabilities/${item._id}`);
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
                            navigate(`/liabilities/${item._id}/edit`);
                        }}
                        title="Edit liability"
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
                        title="Delete liability"
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
                        <Scale className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                        Liabilities
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage accounts payable and receivable.</p>
                </div>
                <Button onClick={() => navigate("/liabilities/new")}>
                    <Plus className="mr-2 h-4 w-4" /> Add Liability
                </Button>
            </div>

            {/* Summaries */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">Accounts Payable</p>
                            <h3 className="text-2xl font-bold text-red-700 dark:text-red-300">AED {totalPayable.toLocaleString()}</h3>
                            <p className="text-xs text-red-600/70 mt-1">Amount owed to others</p>
                        </div>
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600">
                            <ArrowDownLeft className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-900">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Accounts Receivable</p>
                            <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">AED {totalReceivable.toLocaleString()}</h3>
                            <p className="text-xs text-emerald-600/70 mt-1">Amount owed to us</p>
                        </div>
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600">
                            <ArrowUpRight className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search liabilities..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800">
                <SortableTable
                    data={paginatedLiabilities}
                    columns={columns}
                />
                {totalPages > 1 && (
                    <div className="border-t border-slate-200 dark:border-slate-800 p-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            itemsPerPage={ITEMS_PER_PAGE}
                            totalItems={filteredLiabilities.length}
                        />
                    </div>
                )}
            </div>

            <DeleteConfirmationDialog
                open={!!deleteItem}
                title="Delete Liability"
                itemName={deleteItem?.description}
                description={`Are you sure you want to delete this liability? This action cannot be undone.`}
                onConfirm={() => {
                    if (deleteItem) {
                        deleteLiability(deleteItem._id);
                        setDeleteItem(null);
                    }
                }}
                onCancel={() => setDeleteItem(null)}
            />
        </div>
    );
}
