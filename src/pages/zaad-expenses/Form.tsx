import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { zaadExpenseSchema } from "@/lib/schemas";
import { useStore } from "@/store";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import * as z from "zod";

type ZaadExpenseFormValues = z.infer<typeof zaadExpenseSchema>;

export default function ZaadExpenseForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { zaadExpenses, addZaadExpense, updateZaadExpense } = useStore();
    const isEditing = Boolean(id);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<ZaadExpenseFormValues>({      // eslint-disable-next-line @typescript-eslint/no-explicit-any        resolver: zodResolver(zaadExpenseSchema) as any,
        defaultValues: {
            title: "",
            amount: 0,
            category: "Other",
            date: new Date().toISOString().split('T')[0],
            description: "",
            paymentMethod: "Cash",
            status: "pending",
        },
    });

    useEffect(() => {
        if (isEditing && id) {
            const expense = zaadExpenses.find((e) => e._id === id);
            if (expense) {
                setValue("title", expense.title);
                setValue("amount", expense.amount);
                setValue("category", expense.category);
                setValue("date", expense.date ? new Date(expense.date).toISOString().split('T')[0] : "");
                setValue("description", expense.description || "");
                setValue("paymentMethod", expense.paymentMethod);
                setValue("status", expense.status);
            }
        }
    }, [id, isEditing, zaadExpenses, setValue]);

    const onSubmit = (data: ZaadExpenseFormValues) => {
        if (isEditing && id) {
            updateZaadExpense(id, data);
        } else {
            addZaadExpense({ ...data, published: true });
        }
        navigate("/zaad-expenses");
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/zaad-expenses")}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {isEditing ? "Edit Expense" : "New Expense"}
                    </h1>
                    <p className="text-slate-500">Record a new office expense</p>
                </div>
            </div>

            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                    <CardTitle>Expense Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title *</label>
                                <Input
                                    {...register("title")}
                                    placeholder="e.g. Office Rent"
                                />
                                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Amount (AED) *</label>
                                <Input
                                    type="number"
                                    {...register("amount", { valueAsNumber: true })}
                                />
                                {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                                <select
                                    {...register("category")}
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-100"
                                >
                                    <option value="Rent">Rent</option>
                                    <option value="Utilities">Utilities</option>
                                    <option value="Payroll">Payroll</option>
                                    <option value="Food">Food</option>
                                    <option value="Supplies">Supplies</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date *</label>
                                <Input
                                    type="date"
                                    {...register("date")}
                                />
                                {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment Method</label>
                                <select
                                    {...register("paymentMethod")}
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-100"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Card">Card</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                                <select
                                    {...register("status")}
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-100"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                            <Input
                                {...register("description")}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate("/zaad-expenses")}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white">
                                <Save className="mr-2 h-4 w-4" /> {isEditing ? "Update Expense" : "Create Expense"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
