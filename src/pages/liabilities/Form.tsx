import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { ILiability, ICompany, IIndividual } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";

type LiabilityFormValues = {
    type: string;
    amount: number;
    paidAmount: number;
    description: string;
    status: string;
};

export default function LiabilityForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const liabilities: any[] = [];
    const companies: any[] = [];
    const individuals: any[] = [];
    const addLiability = (liability: any) => console.log('Add liability:', liability);
    const updateLiability = (id: string, liability: any) => console.log('Update liability:', id, liability);
    const isEditing = Boolean(id);
    const existingLiability = liabilities.find((l: ILiability) => l._id === id);

    // Local state for entity selection toggle
    const [entityType, setEntityType] = useState<"company" | "individual">(
        existingLiability?.individual ? "individual" : "company"
    );

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<LiabilityFormValues>({
        defaultValues: {
            type: "payable",
            amount: 0,
            paidAmount: 0,
            description: "",
            status: "pending",
            dueDate: new Date().toISOString().split('T')[0],
            company: undefined,
            individual: undefined,
        },
    });

    useEffect(() => {
        if (isEditing && id && existingLiability) {
            setValue("type", existingLiability.type);
            setValue("amount", existingLiability.amount);
            setValue("paidAmount", existingLiability.paidAmount || 0);
            setValue("description", existingLiability.description || "");
            setValue("status", existingLiability.status);
            setValue("dueDate", existingLiability.dueDate ? new Date(existingLiability.dueDate).toISOString().split('T')[0] : "");

            if (existingLiability.individual) {
                setValue("individual", existingLiability.individual);
                setValue("company", undefined);
            } else if (existingLiability.company) {
                setValue("company", existingLiability.company);
                setValue("individual", undefined);
            }
        }
    }, [existingLiability, id, isEditing, setValue]);

    const onSubmit = (data: LiabilityFormValues) => {
        // Ensure data consistency
        const finalData = { ...data };
        if (entityType === "company") {
            finalData.individual = undefined;
        } else {
            finalData.company = undefined;
        }

        if (isEditing && id) {
            updateLiability(id, finalData);
        } else {
            addLiability({ ...finalData, published: true });
        }
        navigate("/liabilities");
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/liabilities")}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {isEditing ? "Edit Liability" : "New Liability"}
                    </h1>
                    <p className="text-slate-500">Record a payable, receivable, or loan</p>
                </div>
            </div>

            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                    <CardTitle>Liability Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Liability Type</label>
                                <select
                                    {...register("type")}
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-100"
                                >
                                    <option value="payable">Accounts Payable</option>
                                    <option value="receivable">Accounts Receivable</option>
                                    <option value="loan">Loan</option>
                                    <option value="credit">Credit</option>
                                    <option value="debit">Debit</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                                <select
                                    {...register("status")}
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-100"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="partial">Partially Paid</option>
                                    <option value="paid">Paid</option>
                                    <option value="active">Active</option>
                                </select>
                            </div>
                        </div>

                        {/* Entity Selection */}
                        <div className="space-y-3 p-4 border rounded-lg border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Associated With</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={entityType === "company"}
                                        onChange={() => {
                                            setEntityType("company");
                                            setValue("individual", undefined);
                                        }}
                                        className="text-brand-600 focus:ring-brand-500"
                                    />
                                    Company
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={entityType === "individual"}
                                        onChange={() => {
                                            setEntityType("individual");
                                            setValue("company", undefined);
                                        }}
                                        className="text-brand-600 focus:ring-brand-500"
                                    />
                                    Individual
                                </label>
                            </div>

                            {entityType === "company" ? (
                                <select
                                    {...register("company")}
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                                >
                                    <option value="">Select Company</option>
                                    {companies.map((c: ICompany) => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            ) : (
                                <select
                                    {...register("individual")}
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                                >
                                    <option value="">Select Individual</option>
                                    {individuals.map((i: IIndividual) => <option key={i._id} value={i._id}>{i.name}</option>)}
                                </select>
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Amount (AED)</label>
                                <Input
                                    type="number"
                                    {...register("amount", { valueAsNumber: true })}
                                />
                                {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Paid Amount (AED)</label>
                                <Input
                                    type="number"
                                    {...register("paidAmount", { valueAsNumber: true })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</label>
                                <Input
                                    type="date"
                                    {...register("dueDate")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                            <Input
                                {...register("description")}
                                placeholder="e.g. Office Renovation partial payment"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate("/liabilities")}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white">
                                <Save className="mr-2 h-4 w-4" /> {isEditing ? "Update Liability" : "Create Liability"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
