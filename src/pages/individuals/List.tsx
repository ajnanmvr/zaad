import { useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import type { IIndividual } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Phone, Mail, Eye, Edit, Trash2 } from "lucide-react";
import { SortableTable } from "@/components/ui/sortable-table";
import { useState } from "react";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Pagination } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

export default function IndividualList() {
    const navigate = useNavigate();
    const { individuals, deleteIndividual } = useStore();
    const [search, setSearch] = useState("");
    const [deleteItem, setDeleteItem] = useState<IIndividual | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const filteredIndividuals = individuals.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.email?.toLowerCase().includes(search.toLowerCase()) ||
        i.phone?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredIndividuals.length / ITEMS_PER_PAGE);
    const paginatedIndividuals = filteredIndividuals.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const columns = [
        {
            key: "name",
            header: "Name",
            render: (d: IIndividual) => (
                <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">
                        {d.name.substring(0, 2).toUpperCase()}
                    </div>
                    {d.name}
                </div>
            )
        },
        {
            key: "nationality",
            header: "Nationality",
            render: (d: IIndividual) => <span className="text-slate-600 dark:text-slate-400">{d.nationality || "-"}</span>
        },
        {
            key: "contact",
            header: "Contact",
            render: (d: IIndividual) => (
                <div className="space-y-1">
                    {d.phone && (
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <Phone className="w-3 h-3" /> {d.phone}
                        </div>
                    )}
                    {d.email && (
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <Mail className="w-3 h-3" /> {d.email}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: "passportNo",
            header: "Passport No",
            render: (d: IIndividual) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{d.passportNo || "-"}</span>
        },
        {
            key: "actions",
            header: "Actions",
            render: (item: IIndividual) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/individuals/${item._id}`);
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
                            navigate(`/individuals/${item._id}/edit`);
                        }}
                        title="Edit individual"
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
                        title="Delete individual"
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
                        Individuals
                    </h1>
                    <p className="text-slate-500 text-sm">Manage personal clients and individual records</p>
                </div>
                <Button onClick={() => navigate("/individuals/new")} className="bg-brand-600 hover:bg-brand-700 text-white gap-2 shadow-lg shadow-brand-500/20">
                    <Plus className="w-4 h-4" />
                    Add Individual
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Individuals</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{individuals.length}</h3>
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
                        placeholder="Search individuals..."
                        className="pl-9 bg-white dark:bg-slate-900"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div>
                    <SortableTable
                        data={paginatedIndividuals}
                        columns={columns}
                        onRowClick={(item) => navigate(`/individuals/${item._id}`)}
                    />
                    {totalPages > 1 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                itemsPerPage={ITEMS_PER_PAGE}
                                totalItems={filteredIndividuals.length}
                            />
                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmationDialog
                open={!!deleteItem}
                title="Delete Individual"
                itemName={deleteItem?.name}
                description={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
                onConfirm={() => {
                    if (deleteItem) {
                        deleteIndividual(deleteItem._id);
                        setDeleteItem(null);
                    }
                }}
                onCancel={() => setDeleteItem(null)}
            />
        </div>
    );
}
