import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Receipt, Eye, Edit, Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import type { IInvoice, ICompany, IEmployee } from "@/types";

const ITEMS_PER_PAGE = 15;

export default function InvoiceList() {
    const invoices: any[] = [];
    const companies: any[] = [];
    const employees: any[] = [];
    const deleteInvoice = (id: string) => console.log('Delete invoice:', id);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteItem, setDeleteItem] = useState<IInvoice | null>(null);
    const [filterMode, setFilterMode] = useState<"all" | "company" | "employees">("all");

    // Get entity context from URL params
    const companyId = searchParams.get("company");
    const employeeId = searchParams.get("employee");
    const individualId = searchParams.get("individual");

    // Filter invoices based on context
    let filteredInvoices = invoices;
    let entityName = "All";
    let isCompanyView = false;

    if (companyId) {
        isCompanyView = true;
        const company = companies.find((c: ICompany) => c._id === companyId);
        entityName = company?.name || "Company";

        if (filterMode === "company") {
            filteredInvoices = invoices.filter((inv: IInvoice) => inv.company === companyId);
        } else if (filterMode === "employees") {
            const companyEmployees = employees.filter((e: IEmployee) => e.company === companyId);
            const empIds = companyEmployees.map((e) => e._id);
            filteredInvoices = invoices.filter((inv: IInvoice) => empIds.includes(inv.company || ""));
        } else {
            // Show all invoices for this company
            const companyEmployees = employees.filter((e: IEmployee) => e.company === companyId);
            const empIds = companyEmployees.map((e) => e._id);
            filteredInvoices = invoices.filter(
                (inv: IInvoice) => inv.company === companyId || empIds.includes(inv.company || "")
            );
        }
    } else if (employeeId) {
        const employee = employees.find((e: IEmployee) => e._id === employeeId);
        entityName = employee?.name || "Employee";
        filteredInvoices = invoices.filter((inv: IInvoice) => inv.company === employee?.company);
    } else if (individualId) {
        filteredInvoices = invoices.filter((inv: IInvoice) => inv.individual === individualId);
    }

    // Search filter
    filteredInvoices = filteredInvoices.filter((inv: IInvoice) => {
        const companyName = companies.find((c) => c._id === inv.company)?.name.toLowerCase() || "";
        return companyName.includes(search.toLowerCase()) ||
            inv.invoiceNo?.toString().includes(search);
    });

    const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "paid":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "sent":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            case "overdue":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            default:
                return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <Receipt className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                        {isCompanyView ? `${entityName} - Invoices` : "Invoices"}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage client invoices and billing.</p>
                </div>
                <Button onClick={() => navigate("/invoices/new")}>
                    <Plus className="mr-2 h-4 w-4" /> Create Invoice
                </Button>
            </div>

            {/* Company View Filter */}
            {isCompanyView && (
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle>Filter Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant={filterMode === "all" ? "default" : "outline"}
                                onClick={() => {
                                    setFilterMode("all");
                                    setCurrentPage(1);
                                }}
                            >
                                All Invoices
                            </Button>
                            <Button
                                variant={filterMode === "company" ? "default" : "outline"}
                                onClick={() => {
                                    setFilterMode("company");
                                    setCurrentPage(1);
                                }}
                            >
                                Company Invoices Only
                            </Button>
                            <Button
                                variant={filterMode === "employees" ? "default" : "outline"}
                                onClick={() => {
                                    setFilterMode("employees");
                                    setCurrentPage(1);
                                }}
                            >
                                Employee Invoices Only
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search invoices..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="rounded-md border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">No.</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Company</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Due Date</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Amount</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Status</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-slate-400">
                                        <Receipt className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-3" />
                                        <p className="font-medium">No invoices found</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedInvoices.map((item, index) => (
                                    <tr
                                        key={item._id}
                                        className={`border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer ${
                                            index % 2 === 0
                                                ? "bg-white dark:bg-slate-900"
                                                : "bg-gray-50/50 dark:bg-slate-800/30"
                                        }`}
                                        onClick={() => navigate(`/invoices/${item._id}`)}
                                    >
                                        <td className="py-3 px-4 font-mono font-medium text-gray-700 dark:text-slate-300">
                                            #{item.invoiceNo}
                                        </td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-slate-300">
                                            {companies.find((c) => c._id === item.company)?.name || "Unknown"}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-slate-400">
                                            {item.validTo || "-"}
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-gray-700 dark:text-slate-300">
                                            AED {item.amount.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/invoices/${item._id}`);
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
                                                        navigate(`/invoices/${item._id}/edit`);
                                                    }}
                                                    title="Edit invoice"
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
                                                    title="Delete invoice"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-slate-800">
                        <div className="text-sm text-gray-600 dark:text-slate-400">
                            Showing {startIndex + 1} to {Math.min(endIndex, filteredInvoices.length)} of {filteredInvoices.length} invoices
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePageChange(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <DeleteConfirmationDialog
                open={!!deleteItem}
                title="Delete Invoice"
                itemName={deleteItem ? `Invoice #${deleteItem.invoiceNo}` : ""}
                description={`Are you sure you want to delete invoice #${deleteItem?.invoiceNo}? This action cannot be undone.`}
                onConfirm={() => {
                    if (deleteItem) {
                        deleteInvoice(deleteItem._id);
                        setDeleteItem(null);
                    }
                }}
                onCancel={() => setDeleteItem(null)}
            />
        </div>
    );
}
