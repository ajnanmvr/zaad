import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Filter, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import type { ComponentType } from "react";
import type { IRecord, ICompany, IEmployee, IIndividual } from "@/types";

const ITEMS_PER_PAGE = 15;

export default function FinancialDashboard() {
    const records: any[] = [];
    const companies: any[] = [];
    const employees: any[] = [];
    const individuals: any[] = [];
    const [searchParams] = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [filterMode, setFilterMode] = useState<"all" | "company" | "employees">("all");

    // Get entity context from URL params
    const companyId = searchParams.get("company");
    const employeeId = searchParams.get("employee");
    const individualId = searchParams.get("individual");

    // Filter records based on context
    let filteredRecords = records;
    let entityName = "All";
    let isCompanyView = false;

    if (companyId) {
        isCompanyView = true;
        const company = companies.find((c: ICompany) => c._id === companyId);
        entityName = company?.name || "Company";

        if (filterMode === "company") {
            filteredRecords = records.filter((r: IRecord) => r.company === companyId && !r.employee);
        } else if (filterMode === "employees") {
            const companyEmployees = employees.filter((e: IEmployee) => e.company === companyId);
            const empIds = companyEmployees.map((e) => e._id);
            filteredRecords = records.filter((r: IRecord) => r.employee && empIds.includes(r.employee));
        } else {
            // Show all records for this company (both company and employee records)
            const companyEmployees = employees.filter((e: IEmployee) => e.company === companyId);
            const empIds = companyEmployees.map((e) => e._id);
            filteredRecords = records.filter(
                (r: IRecord) => r.company === companyId || (r.employee && empIds.includes(r.employee))
            );
        }
    } else if (employeeId) {
        const employee = employees.find((e: IEmployee) => e._id === employeeId);
        entityName = employee?.name || "Employee";
        filteredRecords = records.filter((r: IRecord) => r.employee === employeeId);
    } else if (individualId) {
        const individual = individuals.find((i: IIndividual) => i._id === individualId);
        entityName = individual?.name || "Individual";
        filteredRecords = records.filter((r: IRecord) => r.individual === individualId);
    }

    // Calculate totals and stats
    const totalRecords = filteredRecords.length;
    const totalIncome = filteredRecords
        .filter((r) => r.type === "income")
        .reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalExpense = filteredRecords
        .filter((r) => r.type === "expense")
        .reduce((sum, r) => sum + (r.amount || 0), 0);
    const netProfit = totalIncome - totalExpense;

    // Pagination
    const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        {isCompanyView ? `${entityName} - Financial Records` : `${entityName} - Accounts Report`}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {isCompanyView ? "View and manage financial records" : "All time summary by transaction methods"}
                    </p>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Transactions"
                    value={totalRecords}
                    sub="In this period"
                    icon={Filter}
                    iconColor="text-slate-600 dark:text-slate-400"
                    bg="bg-white dark:bg-slate-900"
                />
                <StatCard
                    title="Net Profit"
                    value={`AED ${netProfit.toLocaleString()}`}
                    sub={netProfit >= 0 ? "Positive" : "Negative"}
                    icon={TrendingUp}
                    iconColor={netProfit >= 0 ? "text-emerald-600" : "text-red-600"}
                    bg={netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}
                    textColor={netProfit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}
                />
                <StatCard
                    title="Total Income"
                    value={`AED ${totalIncome.toLocaleString()}`}
                    sub="Credits"
                    icon={TrendingUp}
                    iconColor="text-emerald-600"
                    bg="bg-emerald-50 dark:bg-emerald-900/20"
                    textColor="text-emerald-700 dark:text-emerald-400"
                />
                <StatCard
                    title="Total Expense"
                    value={`AED ${totalExpense.toLocaleString()}`}
                    sub="Debits"
                    icon={TrendingDown}
                    iconColor="text-red-600"
                    bg="bg-red-50 dark:bg-red-900/20"
                    textColor="text-red-700 dark:text-red-400"
                />
            </div>

            {/* Company View Filter */}
            {isCompanyView && (
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle>Filter Records</CardTitle>
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
                                All Records
                            </Button>
                            <Button
                                variant={filterMode === "company" ? "default" : "outline"}
                                onClick={() => {
                                    setFilterMode("company");
                                    setCurrentPage(1);
                                }}
                            >
                                Company Records Only
                            </Button>
                            <Button
                                variant={filterMode === "employees" ? "default" : "outline"}
                                onClick={() => {
                                    setFilterMode("employees");
                                    setCurrentPage(1);
                                }}
                            >
                                Employee Records Only
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Records Table */}
            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Financial Records</CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-500">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Particular</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Entity</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Method</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Type</th>
                                    <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Amount</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400">
                                            No financial records found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRecords.map((record, index) => {
                                        const emp = record.employee
                                            ? employees.find((e: IEmployee) => e._id === record.employee)
                                            : null;
                                        const company = record.company
                                            ? companies.find((c: ICompany) => c._id === record.company)
                                            : null;
                                        const individual = record.individual
                                            ? individuals.find((i: IIndividual) => i._id === record.individual)
                                            : null;

                                        const entityDisplay = emp?.name || company?.name || individual?.name || "-";

                                        return (
                                            <tr
                                                key={record._id}
                                                className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                                    index % 2 === 0
                                                        ? "bg-white dark:bg-slate-900"
                                                        : "bg-slate-50/50 dark:bg-slate-800/30"
                                                }`}
                                            >
                                                <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                                    {new Date(record.date).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                                    <span className="font-medium">{record.particular}</span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                                                    {entityDisplay}
                                                </td>
                                                <td className="py-3 px-4 text-slate-600 dark:text-slate-400 capitalize">
                                                    {record.method || "-"}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                                            record.type === "income"
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                        }`}
                                                    >
                                                        {record.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold">
                                                    <span
                                                        className={
                                                            record.type === "income"
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : "text-red-600 dark:text-red-400"
                                                        }
                                                    >
                                                        {record.type === "income" ? "+" : "-"}
                                                        {record.amount.toLocaleString()} AED
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-block px-2 py-1 rounded text-xs font-semibold capitalize ${
                                                            record.status === "cleared"
                                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                        }`}
                                                    >
                                                        {record.status || "pending"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Showing {startIndex + 1} to {Math.min(endIndex, totalRecords)} of {totalRecords} records
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
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
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

type StatCardProps = {
    title: string;
    value: string | number;
    sub: string;
    icon: ComponentType<{ className?: string }>;
    iconColor?: string;
    bg?: string;
    textColor?: string;
};

function StatCard({ title, value, sub, icon: Icon, iconColor, bg, textColor }: StatCardProps) {
    return (
        <Card className={`border-slate-200 dark:border-slate-800 shadow-sm ${bg}`}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="mt-2">
                    <h3 className={`text-2xl font-bold ${textColor || "text-slate-900 dark:text-slate-100"}`}>{value}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>
                </div>
            </CardContent>
        </Card>
    );
}
