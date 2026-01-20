import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IEmployee, ICompany, IDocument, IRecord } from "@/types";
import { ArrowLeft, UserCircle, Edit, Phone, Mail, FileText, BadgeCheck, Briefcase, DollarSign, Receipt } from "lucide-react";
import DocumentManagement from "@/components/DocumentManagement";
import { useState } from "react";

export default function EmployeeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const employees: any[] = [];
    const companies: any[] = [];
    const documents: any[] = [];
    const records: any[] = [];
    const invoices: any[] = [];
    const [dismissedDocs, setDismissedDocs] = useState<Set<string>>(new Set());

    const employee = employees.find((e: IEmployee) => e._id === id);

    if (!employee) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Employee not found</h2>
                <Button className="mt-4" onClick={() => navigate("/employees")}>Go Back</Button>
            </div>
        );
    }

    const companyName = companies.find((c: any) => c._id === employee.company)?.name || "Unknown Company";
    const employeeDocs = documents.filter((d: any) => d.employee === id && !dismissedDocs.has(d._id));
    const employeeRecords = records.filter((r: any) => r.employee === id);
    const employeeInvoices = invoices.filter((inv: any) => inv.company === employee.company);

    const handleRenewDoc = (docId: string) => {
        alert(`Renewal initiated for document ${docId}. In a real app, this would open a renewal form.`);
    };

    const handleDismissDoc = (docId: string, reason: string) => {
        setDismissedDocs(prev => new Set(prev).add(docId));
        console.log(`Document ${docId} dismissed with reason: ${reason}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/employees")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">{employee.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <BadgeCheck className="h-4 w-4 text-emerald-600" />
                        <span>{employee.designation}</span>
                        <span>•</span>
                        <span className="font-semibold">{companyName}</span>
                    </div>
                </div>
                <Button onClick={() => navigate(`/employees/${id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info */}
                <Card className="md:col-span-2 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" /> Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nationality</span>
                            <p className="dark:text-gray-200">{employee.nationality || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Emirates ID</span>
                            <p className="dark:text-gray-200">{employee.emiratesId || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</span>
                            <p className="flex items-center gap-1 dark:text-gray-200"><Mail className="h-3 w-3" />{employee.email || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phone</span>
                            <p className="flex items-center gap-1 dark:text-gray-200"><Phone className="h-3 w-3" />{employee.phone1 || "-"}</p>
                        </div>
                        {employee.remarks && (
                            <div className="col-span-full pt-4 border-t border-gray-100 dark:border-gray-700">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Remarks</span>
                                <p className="text-sm mt-1 dark:text-gray-200">{employee.remarks}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Documents Side */}
                <div className="space-y-6">
                    <Card className="dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Financial Records
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" onClick={() => navigate(`/financials?employee=${id}`)}>
                                View Records
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" /> Invoices
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold dark:text-gray-200">{employeeInvoices.length}</div>
                            <Button variant="link" className="p-0 h-auto mt-2" onClick={() => navigate(`/invoices?employee=${id}`)}>
                                View All Invoices
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" /> Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {employeeDocs.length === 0 ? (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">No documents linked</div>
                                ) : (
                                    employeeDocs.map((doc: any) => (
                                        <div key={doc._id} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 pb-2 last:pb-0">
                                            <span className="dark:text-gray-300">{doc.name}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${new Date(doc.expiryDate!) < new Date() ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
                                                {doc.expiryDate}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Document Management */}
            <DocumentManagement 
                documents={documents.filter((d: IDocument) => d.employee === id)} 
                onRenew={handleRenewDoc}
                onDismiss={handleDismissDoc}
                compact={false}
            />

            {/* Company Records */}
            {employeeRecords.length > 0 && (
                <Card className="dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5 dark:text-gray-400" /> Company Financial Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {employeeRecords.slice(0, 8).map((rec: any) => (
                                <div key={rec._id} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 pb-2 last:pb-0">
                                    <div>
                                        <p className="font-medium dark:text-gray-200">{rec.particular}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{rec.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${rec.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {rec.type === 'income' ? '+' : '-'} {rec.amount.toLocaleString()} AED
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
