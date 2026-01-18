import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SortableTable } from "@/components/ui/sortable-table";
import type { ColumnDef } from "@/components/ui/sortable-table";
import { Plus, Search, Building2, Eye, Edit, Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Pagination } from "@/components/ui/pagination";
import type { ICompany } from "@/types";

const ITEMS_PER_PAGE = 10;

export default function CompanyList() {
    const { companies, deleteCompany } = useStore();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteItem, setDeleteItem] = useState<ICompany | null>(null);

    const filteredCompanies = companies.filter((company) =>
        company.name.toLowerCase().includes(search.toLowerCase()) ||
        company.licenseNo?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const columns: ColumnDef<ICompany>[] = [
        { key: "name", header: "Company Name", sortable: true, className: "font-medium" },
        { key: "licenseNo", header: "License No", sortable: true },
        {
            key: "companyType",
            header: "Type",
            sortable: true,
            render: (item: ICompany) => <span className="uppercase text-xs font-bold text-gray-500">{item.companyType}</span>
        },
        { key: "emirates", header: "Emirates", sortable: true },
        {
            key: "isMainland",
            header: "Zone",
            sortable: true,
            render: (item: ICompany) => (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.isMainland === "mainland" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                    {item.isMainland === "mainland" ? "Mainland" : "Freezone"}
                </span>
            )
        },
        {
            key: "actions",
            header: "Actions",
            sortable: false,
            className: "text-right",
            render: (item: ICompany) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/companies/${item._id}`);
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
                            navigate(`/companies/${item._id}/edit`);
                        }}
                        title="Edit company"
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
                        title="Delete company"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                        Companies
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your business entities and licenses.</p>
                </div>
                <Button onClick={() => navigate("/companies/new")}>
                    <Plus className="mr-2 h-4 w-4" /> Add Company
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <Input
                        placeholder="Search companies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="rounded-md border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <SortableTable
                    data={paginatedCompanies}
                    columns={columns}
                    onRowClick={(item) => navigate(`/companies/${item._id}`)}
                />
                {paginatedCompanies.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                        <Building2 className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-3" />
                        <p className="font-medium">No companies found</p>
                        <p className="text-sm">Try adjusting your search or add a new company.</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={filteredCompanies.length}
                />
            )}

            <DeleteConfirmationDialog
                open={!!deleteItem}
                title="Delete Company"
                itemName={deleteItem?.name}
                description={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
                onConfirm={() => {
                    if (deleteItem) {
                        deleteCompany(deleteItem._id);
                        setDeleteItem(null);
                    }
                }}
                onCancel={() => setDeleteItem(null)}
            />
        </div>
    );
}
