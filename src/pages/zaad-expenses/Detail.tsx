import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";

import type { IZaadExpense } from "@/types";

export default function ZaadExpenseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { zaadExpenses } = useStore();

    const expense = zaadExpenses.find((e: IZaadExpense) => e._id === id);

    if (!expense) return <div className="p-8">Expense not found</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/zaad-expenses")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Expense Details</h1>
                        <p className="text-slate-500">Office Expense Record</p>
                    </div>
                </div>
                <Button onClick={() => navigate(`/zaad-expenses/${id}/edit`)} className="gap-2">
                    <Edit className="w-4 h-4" /> Edit
                </Button>
            </div>

            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{expense.title}</CardTitle>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${expense.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                            {expense.status}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-slate-600 dark:text-slate-400">{expense.description}</p>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-slate-500">Amount</label>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{expense.amount.toLocaleString()} AED</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-500">Date</label>
                            <p className="text-lg font-medium">{new Date(expense.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-500">Category</label>
                            <p className="text-lg font-medium">{expense.category}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-500">Payment Method</label>
                            <p className="text-lg font-medium">{expense.paymentMethod}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
