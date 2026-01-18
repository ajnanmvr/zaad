import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ICompany, IEmployee, IDocument, IRecord } from "@/types";
import { ArrowLeft, Building2, Edit, FileText, Phone, Mail, MapPin, Users, AlertCircle, Clock, DollarSign, Receipt } from "lucide-react";
import DocumentManagement from "@/components/DocumentManagement";
import { useState } from "react";

export default function CompanyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { companies, employees, documents, records } = useStore();
    const [dismissedDocs, setDismissedDocs] = useState<Set<string>>(new Set());

    const company = companies.find((c: ICompany) => c._id === id);

    if (!company) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Company not found</h2>
                <Button className="mt-4" onClick={() => navigate("/companies")}>Go Back</Button>
            </div>
        );
    }

    const companyEmployees = employees.filter((e: IEmployee) => e.company === id);
    const companyDocs = documents.filter((d: IDocument) => d.company === id && !dismissedDocs.has(d._id));
    const companyRecords = records.filter((r: IRecord) => r.company === id);
    const companyInvoices = useStore().invoices.filter(inv => inv.company === id);
    
    // Employee documents - only show expired and expiring (not valid)
    const employeeDocsExpiredOrExpiring = documents.filter((d: IDocument) => {
        const emp = companyEmployees.find(e => e._id === d.employee);
        if (!emp || !d.expiryDate) return false;
        if (dismissedDocs.has(d._id)) return false;
        
        const expiryDate = new Date(d.expiryDate!);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        // Show only expired and expiring soon (within 30 days)
        return expiryDate < thirtyDaysFromNow;
    });

    const employeeDocsExpired = employeeDocsExpiredOrExpiring.filter((d: IDocument) => {
        return new Date(d.expiryDate!) < new Date();
    });

    const employeeDocsSoon = employeeDocsExpiredOrExpiring.filter((d: IDocument) => {
        const expiryDate = new Date(d.expiryDate!);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiryDate >= new Date() && expiryDate < thirtyDaysFromNow;
    });

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
                <Button variant="ghost" size="icon" onClick={() => navigate("/companies")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="uppercase font-semibold tracking-wider">{company.licenseNo}</span>
                        <span>•</span>
                        <span className="capitalize">{company.companyType}</span>
                    </div>
                </div>
                <Button onClick={() => navigate(`/companies/${id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info */}
                <Card className="md:col-span-2 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Company Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Jurisdiction</span>
                            <p className="dark:text-gray-200">{company.isMainland === "mainland" ? "Mainland" : "Freezone"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Emirates</span>
                            <p className="flex items-center gap-1 dark:text-gray-200"><MapPin className="h-3 w-3" /> {company.emirates}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</span>
                            <p className="flex items-center gap-1 dark:text-gray-200"><Mail className="h-3 w-3" />{company.email || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phone</span>
                            <p className="flex items-center gap-1 dark:text-gray-200"><Phone className="h-3 w-3" />{company.phone1 || "-"}</p>
                        </div>
                        {company.remarks && (
                            <div className="col-span-full pt-4 border-t border-gray-100 dark:border-gray-700">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Remarks</span>
                                <p className="text-sm mt-1 dark:text-gray-200">{company.remarks}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Stats / Side */}
                <div className="space-y-6">
                    <Card className="dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" /> Employees
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold dark:text-gray-200">{companyEmployees.length}</div>
                            <Button variant="link" className="p-0 h-auto mt-2" onClick={() => navigate(`/employees?company=${id}`)}>
                                View All Employees
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Financial Records
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" onClick={() => navigate(`/financials?company=${id}`)}>
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
                            <div className="text-2xl font-bold dark:text-gray-200">{companyInvoices.length}</div>
                            <Button variant="link" className="p-0 h-auto mt-2" onClick={() => navigate(`/invoices?company=${id}`)}>
                                View All Invoices
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" /> Company Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold dark:text-gray-200">{companyDocs.length}</div>
                            {companyDocs.length > 0 && (
                                <Button variant="link" className="p-0 h-auto mt-2" onClick={() => navigate("/documents/expiring")}>
                                    View All Docs
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Company Documents Section */}
            {companyDocs.length > 0 && (
                <Card className="dark:border-gray-700">
                    <CardHeader>
                        <CardTitle>Company Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DocumentManagement
                            documents={companyDocs}
                            onRenew={handleRenewDoc}
                            onDismiss={handleDismissDoc}
                            compact={true}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Employee Documents Alert */}
            {(employeeDocsExpired.length > 0 || employeeDocsSoon.length > 0) && (
                <Card className="border-orange-200 dark:border-orange-900 bg-linear-to-r from-orange-50 to-transparent dark:from-orange-900/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                            <AlertCircle className="h-5 w-5" /> Employee Documents - Action Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {employeeDocsExpired.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Expired ({employeeDocsExpired.length})
                                </h4>
                                <div className="space-y-2">
                                    {employeeDocsExpired.map(doc => {
                                        const emp = companyEmployees.find(e => e._id === doc.employee);
                                        return (
                                            <div key={doc._id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-red-100 dark:border-red-900 flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-sm dark:text-gray-200">{emp?.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{doc.name}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded">{doc.expiryDate}</span>
                                                    <Button size="sm" onClick={() => handleRenewDoc(doc._id)}>Renew</Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleDismissDoc(doc._id, 'Renewed by other provider')}>Dismiss</Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {employeeDocsSoon.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Expiring Soon ({employeeDocsSoon.length})
                                </h4>
                                <div className="space-y-2">
                                    {employeeDocsSoon.map(doc => {
                                        const emp = companyEmployees.find(e => e._id === doc.employee);
                                        return (
                                            <div key={doc._id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-amber-100 dark:border-amber-900 flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-sm dark:text-gray-200">{emp?.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{doc.name}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded">{doc.expiryDate}</span>
                                                    <Button size="sm" onClick={() => handleRenewDoc(doc._id)}>Renew</Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Company Records */}
            {companyRecords.length > 0 && (
                <Card className="dark:border-gray-700">
                    <CardHeader>
                        <CardTitle>Financial Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {companyRecords.slice(0, 10).map(rec => (
                                <div key={rec._id} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-slate-700 last:border-0 pb-2 last:pb-0">
                                    <div>
                                        <p className="font-medium dark:text-gray-200">{rec.particular}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{rec.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${rec.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {rec.type === 'income' ? '+' : '-'} {rec.amount.toLocaleString()} AED
                                        </p>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${rec.status === 'cleared' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                                            {rec.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {companyRecords.length > 10 && (
                                <Button variant="link" className="p-0 h-auto mt-4" onClick={() => navigate(`/records?company=${id}`)}>
                                    View All Records
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
