import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import type { ILiability, ICompany, IIndividual } from "@/types";

export default function LiabilityDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const liabilities: any[] = [];
    const companies: any[] = [];
    const individuals: any[] = [];

    const liability = liabilities.find((l: ILiability) => l._id === id);
    // Find related entity name
    const relatedEntity = liability?.company
        ? companies.find((c: ICompany) => c._id === liability.company)?.name
        : individuals.find((i: IIndividual) => i._id === liability?.individual)?.name;

    if (!liability) return <div className="p-8">Liability not found</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/liabilities")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Liability Details</h1>
                        <p className="text-slate-500">Manage debts and receivables</p>
                    </div>
                </div>
                <Button onClick={() => navigate(`/liabilities/${id}/edit`)} className="gap-2">
                    <Edit className="w-4 h-4" /> Edit
                </Button>
            </div>

            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{liability.description}</CardTitle>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${liability.status === 'paid' ? 'bg-green-100 text-green-700' :
                            liability.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-700'
                            }`}>
                            {liability.status}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-slate-500">Type</label>
                            <p className="text-lg font-medium capitalize">{liability.type}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-500">Related Entity</label>
                            <p className="text-lg font-medium">{relatedEntity || "N/A"}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-500">Total Amount</label>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{liability.amount.toLocaleString()} AED</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-500">Paid Amount</label>
                            <p className="text-xl font-bold text-green-600">{liability.paidAmount?.toLocaleString() || 0} AED</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-sm font-medium text-slate-500">Due Date</label>
                        <p className="text-slate-900 dark:text-slate-100">
                            {liability.dueDate ? new Date(liability.dueDate).toLocaleDateString() : "No Due Date"}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
