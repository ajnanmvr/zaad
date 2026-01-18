import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStore } from "@/store";
import { invoiceSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function InvoiceForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { invoices, companies, addInvoice, updateInvoice } = useStore();
    const isEdit = !!id;

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema) as any,
        defaultValues: {
            invoiceNo: Math.floor(Math.random() * 10000), // temp
            company: "",
            date: new Date().toISOString().split('T')[0],
            items: [{ title: "", desc: "", rate: 0, quantity: 1 }],
            status: "draft",
            amount: 0
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const items = watch("items");

    useEffect(() => {
        if (isEdit && id) {
            const invoice = invoices.find((i) => i._id === id);
            if (invoice) {
                setValue("invoiceNo", invoice.invoiceNo);
                setValue("company", invoice.company || "");
                setValue("date", invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : "");
                setValue("items", invoice.items || []);
                setValue("status", invoice.status);
                setValue("amount", invoice.amount);
                // Set other fields as needed
            } else {
                navigate("/invoices");
            }
        }
    }, [id, isEdit, invoices, navigate, setValue]);

    const calculateTotal = () => {
        return items?.reduce((sum, item) => sum + ((item.rate || 0) * (item.quantity || 0)), 0) || 0;
    };

    const onSubmit = (data: InvoiceFormValues) => {
        const finalData = { ...data, amount: calculateTotal() };
        if (isEdit && id) {
            updateInvoice(id, finalData);
        } else {
            addInvoice({ ...finalData, published: true });
        }
        navigate("/invoices");
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between">
                            <span>Invoice Details</span>
                            <span className="text-emerald-600">Total: AED {calculateTotal().toLocaleString()}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="invoiceNo">Invoice No</Label>
                                <Input
                                    id="invoiceNo"
                                    type="number"
                                    {...register("invoiceNo", { valueAsNumber: true })}
                                />
                                {errors.invoiceNo && <p className="text-sm text-red-500">{errors.invoiceNo.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <select
                                    id="company"
                                    {...register("company")}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select Company</option>
                                    {companies.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    {...register("date")}
                                />
                                {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="font-semibold text-sm">Line Items</h3>
                            </div>

                            {fields.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-5 space-y-1">
                                        <Label className="text-xs text-gray-500">Description</Label>
                                        <Input
                                            {...register(`items.${index}.title`)}
                                            placeholder="Item description"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-xs text-gray-500">Qty</Label>
                                        <Input
                                            type="number"
                                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-1">
                                        <Label className="text-xs text-gray-500">Rate</Label>
                                        <Input
                                            type="number"
                                            {...register(`items.${index}.rate`, { valueAsNumber: true })}
                                        />
                                    </div>
                                    <div className="col-span-2 pb-1">
                                        <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            <Button type="button" variant="outline" size="sm" onClick={() => append({ title: "", desc: "", rate: 0, quantity: 1 })}>
                                <Plus className="mr-2 h-4 w-4" /> Add Item
                            </Button>
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => navigate("/invoices")}>Cancel</Button>
                            <Button type="submit">
                                <Save className="mr-2 h-4 w-4" /> Save Invoice
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
