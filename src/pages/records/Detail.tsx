import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IRecord, ICompany, IEmployee, IIndividual } from "@/types";
import { ArrowLeft, Edit, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function RecordDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const records: any[] = [];
    const companies: any[] = [];
    const employees: any[] = [];
    const individuals: any[] = [];

    const record = records.find((r: IRecord) => r._id === id);
    
    const employee = record?.employee ? employees.find((e: IEmployee) => e._id === record.employee) : null;
    const relatedCompany = record?.company ? companies.find((c: ICompany) => c._id === record.company) : null;
    const individual = record?.individual ? individuals.find((i: IIndividual) => i._id === record.individual) : null;
    const employeeCompany = employee?.company ? companies.find((c: ICompany) => c._id === employee.company) : null;

    if (!record) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Record not found</h2>
                <Button className="mt-4" onClick={() => navigate("/records")}>Go Back</Button>
            </div>
        );
    }

    const isIncome = record.type === "income";

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/records")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">Transaction Details</h1>
                </div>
                <Button onClick={() => navigate(`/records/${id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                {isIncome ? <ArrowDownLeft className="text-green-600" /> : <ArrowUpRight className="text-red-600" />}
                                {record.particular}
                            </CardTitle>
                            <p className="text-slate-500 mt-1">{new Date(record.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${record.status === 'cleared' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {record.status}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                        <p className="text-sm font-medium text-slate-500 mb-1">Amount</p>
                        <p className={`text-4xl font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                            {isIncome ? '+' : '-'}{record.amount.toLocaleString()} <span className="text-lg text-slate-400">AED</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-slate-500">Category</label>
                            <p className="font-medium">{record.category}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-500">Payment Method</label>
                            <p className="font-medium capitalize">{record.method}</p>
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-medium text-slate-500">Client</label>
                            {employee ? (
                                <div>
                                    <p className="font-medium">{employee.name}</p>
                                    {employeeCompany && (
                                        <p className="text-sm text-slate-500">Company: {employeeCompany.name}</p>
                                    )}
                                </div>
                            ) : relatedCompany ? (
                                <p className="font-medium">{relatedCompany.name}</p>
                            ) : individual ? (
                                <p className="font-medium">{individual.name}</p>
                            ) : (
                                <p className="text-slate-400">N/A</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-500">Invoice No</label>
                            <p className="font-medium">{record.invoiceNo || "N/A"}</p>
                        </div>
                        {record.remarks && (
                            <div className="col-span-2">
                                <label className="text-sm font-medium text-slate-500">Remarks</label>
                                <p className="text-slate-700 dark:text-slate-300">{record.remarks}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
