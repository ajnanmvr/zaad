import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IIndividual, ILiability, IDocument } from "@/types";
import { ArrowLeft, Edit, User, Phone, Mail, FileText, Globe, DollarSign, Receipt } from "lucide-react";
import DocumentManagement from "@/components/DocumentManagement";

export default function IndividualDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { individuals, liabilities, documents } = useStore();

    const individual = individuals.find((i: IIndividual) => i._id === id);

    if (!individual) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Individual not found</h2>
                <Button className="mt-4" onClick={() => navigate("/individuals")}>Go Back</Button>
            </div>
        );
    }

    const individualLiabilities = liabilities.filter((l: ILiability) => l.individual === id);
    const individualInvoices = useStore().invoices.filter(inv => inv.individual === id);

    const handleRenewDoc = (docId: string) => {
        alert(`Renewal initiated for document ${docId}. In a real app, this would open a renewal form.`);
    };

    const handleDismissDoc = (docId: string, reason: string) => {
        console.log(`Document ${docId} dismissed with reason: ${reason}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/individuals")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">{individual.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="uppercase font-semibold tracking-wider">{individual.passportNo}</span>
                    </div>
                </div>
                <Button onClick={() => navigate(`/individuals/${id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" /> Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nationality</span>
                            <p className="flex items-center gap-1 dark:text-gray-200"><Globe className="h-3 w-3" /> {individual.nationality}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</span>
                            <p className="flex items-center gap-1 dark:text-gray-200"><Mail className="h-3 w-3" />{individual.email || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phone</span>
                            <p className="flex items-center gap-1 dark:text-gray-200"><Phone className="h-3 w-3" />{individual.phone || "-"}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Liabilities Side Panel */}
                <div className="space-y-6">
                    <Card className="dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Financial Records
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" onClick={() => navigate(`/financials?individual=${id}`)}>
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
                            <div className="text-2xl font-bold dark:text-gray-200">{individualInvoices.length}</div>
                            <Button variant="link" className="p-0 h-auto mt-2" onClick={() => navigate(`/invoices?individual=${id}`)}>
                                View All Invoices
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-red-600 dark:text-red-400" /> Active Liabilities
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {individualLiabilities.length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No liabilities found.</p>
                                ) : (
                                    individualLiabilities.map(l => (
                                        <div key={l._id} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="text-sm font-medium dark:text-gray-200">{l.description}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{l.type}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold dark:text-gray-200">{l.amount.toLocaleString()} AED</p>
                                                <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${l.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                                    }`}>{l.status}</span>
                                            </div>
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
                documents={documents.filter((d: IDocument) => d.individual === id)} 
                onRenew={handleRenewDoc}
                onDismiss={handleDismissDoc}
                compact={false}
            />
        </div>
    );
}
