import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStore } from "@/store";
import { recordSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, TrendingUp, TrendingDown } from "lucide-react";

type RecordFormValues = z.infer<typeof recordSchema>;

export default function RecordForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { records, addRecord, updateRecord } = useStore();
    const initialType = (searchParams.get("type") as "income" | "expense") || "income";
    const isEdit = !!id;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RecordFormValues>({
        resolver: zodResolver(recordSchema) as any,
        defaultValues: {
            type: initialType,
            amount: 0,
            particular: "",
            method: "bank",
            status: "cleared",
            date: new Date().toISOString().split('T')[0],
        },
    });

    // Watch type to update title dynamically
    const currentType = watch("type");

    useEffect(() => {
        if (isEdit && id) {
            const record = records.find((r) => r._id === id);
            if (record) {
                setValue("type", record.type);
                setValue("amount", record.amount);
                setValue("particular", record.particular);
                setValue("method", record.method || "bank");
                setValue("status", record.status || "cleared");
                setValue("date", record.date ? new Date(record.date).toISOString().split('T')[0] : "");
            } else {
                navigate("/records");
            }
        }
    }, [id, isEdit, records, navigate, setValue]);

    const onSubmit = (data: RecordFormValues) => {
        if (isEdit && id) {
            updateRecord(id, data);
        } else {
            addRecord({ ...data, published: true });
        }
        navigate("/records");
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/records")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {currentType === "income" ? <TrendingUp className="h-6 w-6 text-emerald-600" /> : <TrendingDown className="h-6 w-6 text-red-600" />}
                        New {currentType === "income" ? "Income" : "Expense"}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Transaction Type</Label>
                                <select
                                    id="type"
                                    {...register("type")}
                                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                >
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (AED)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    {...register("amount", { valueAsNumber: true })}
                                />
                                {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="particular">Particular / Description</Label>
                            <Input
                                id="particular"
                                {...register("particular")}
                            />
                            {errors.particular && <p className="text-sm text-red-500">{errors.particular.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="method">Payment Method</Label>
                                <select
                                    id="method"
                                    {...register("method")}
                                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                >
                                    <option value="bank">Bank Transfer</option>
                                    <option value="cash">Cash</option>
                                    <option value="tasdeed">Tasdeed</option>
                                    <option value="swiper">Swiper / POS</option>
                                    <option value="service fee">Service Fee</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    {...register("status")}
                                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                >
                                    <option value="cleared">Cleared</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => navigate("/records")}>Cancel</Button>
                            <Button type="submit">
                                <Save className="mr-2 h-4 w-4" /> Save Record
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
