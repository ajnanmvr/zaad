import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

type IndividualFormValues = {
    name: string;
    nationality: string;
    passportNo: string;
    phone: string;
    email: string;
    remarks?: string;
};

export default function IndividualForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const individuals: any[] = [];
    const addIndividual = (individual: any) => console.log('Add individual:', individual);
    const updateIndividual = (id: string, individual: any) => console.log('Update individual:', id, individual);
    const deleteIndividual = (id: string) => console.log('Delete individual:', id);
    const isEdit = !!id;

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<IndividualFormValues>({
        defaultValues: {
            name: "",
            nationality: "",
            passportNo: "",
            phone: "",
            email: "",
            remarks: "",
        },
    });

    useEffect(() => {
        if (isEdit && id) {
            const individual = individuals.find((i) => i._id === id);
            if (individual) {
                setValue("name", individual.name);
                setValue("nationality", individual.nationality || "");
                setValue("passportNo", individual.passportNo || "");
                setValue("phone", individual.phone || "");
                setValue("email", individual.email || "");
                setValue("remarks", individual.remarks || "");
            } else {
                navigate("/individuals");
            }
        }
    }, [id, isEdit, individuals, navigate, setValue]);

    const onSubmit = (data: IndividualFormValues) => {
        if (isEdit && id) {
            updateIndividual(id, data);
        } else {
            addIndividual({ ...data, published: true });
        }
        navigate("/individuals");
    };

    const handleDelete = () => {
        if (isEdit && id) {
            if (confirm("Are you sure you want to delete this individual?")) {
                deleteIndividual(id);
                navigate("/individuals");
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/individuals")}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {isEdit ? "Edit Individual" : "New Individual"}
                    </h1>
                    <p className="text-slate-500">Manage individual client details</p>
                </div>
                {isEdit && (
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name *</label>
                            <Input
                                {...register("name")}
                                placeholder="e.g. Ali Hassan"
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nationality</label>
                                <Input {...register("nationality")} placeholder="e.g. UAE" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Passport Number</label>
                                <Input {...register("passportNo")} placeholder="e.g. N12345678" />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                                <Input {...register("phone")} placeholder="+971 50 123 4567" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                                <Input type="email" {...register("email")} placeholder="ali@example.com" />
                                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Remarks</label>
                            <textarea
                                {...register("remarks")}
                                className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate("/individuals")}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white">
                                <Save className="mr-2 h-4 w-4" /> {isEdit ? "Update Individual" : "Create Individual"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
