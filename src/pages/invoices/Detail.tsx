import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { IInvoice, ICompany } from "@/types";
import { ArrowLeft, Printer, Edit } from "lucide-react";

export default function InvoiceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const invoices: any[] = [];
    const companies: any[] = [];

    const invoice = invoices.find((i: IInvoice) => i._id === id);
    const company = companies.find((c: ICompany) => c._id === invoice?.company);

    if (!invoice) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Invoice not found</h2>
                <Button className="mt-4" onClick={() => navigate("/invoices")}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">Invoice #{invoice.invoiceNo}</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                    <Button onClick={() => navigate(`/invoices/${id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                </div>
            </div>

            <Card className="print:shadow-none print:border-0">
                <CardContent className="p-8 space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b pb-8">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">INVOICE</h2>
                            <p className="text-slate-500 mt-1">{invoice.title}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="font-bold text-lg">{company?.name || "Unknown Company"}</h3>
                            <p className="text-sm text-slate-500">{company?.email}</p>
                            <p className="text-sm text-slate-500">{company?.phone1}</p>
                            <p className="text-sm text-slate-500 mt-2">TRN: {invoice.trn || "N/A"}</p>
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Bill To</p>
                            <p className="font-medium mt-1 text-lg">{invoice.client || "Client Name"}</p>
                            <p className="text-slate-500 text-sm">{invoice.location}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-right">
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase">Date</p>
                                <p className="font-medium">{new Date(invoice.date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase">Due Date</p>
                                <p className="font-medium">{invoice.validTo ? new Date(invoice.validTo).toLocaleDateString() : "-"}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm font-medium text-slate-500 uppercase">Amount Due</p>
                                <p className="font-bold text-xl text-emerald-600">{invoice.amount.toLocaleString()} AED</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 text-right">Rate</th>
                                    <th className="px-4 py-3 text-center">Qty</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoice.items?.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{item.title}</p>
                                            <p className="text-slate-500 text-xs">{item.desc}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right">{(item.rate || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center">{item.quantity || 0}</td>
                                        <td className="px-4 py-3 text-right">{((item.rate || 0) * (item.quantity || 0)).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Subtotal</span>
                                <span>{(invoice.amount - (invoice.tax || 0)).toLocaleString()} AED</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Tax</span>
                                <span>{invoice.tax?.toLocaleString() || 0} AED</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-4 border-t">
                                <span>Total</span>
                                <span>{invoice.amount.toLocaleString()} AED</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    {invoice.remarks && (
                        <div className="bg-slate-50 p-4 rounded text-sm text-slate-600">
                            <strong>Remarks:</strong> {invoice.remarks}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
