import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStore } from "@/store";
import { companySchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

type CompanyFormValues = z.infer<typeof companySchema>;

export default function CompanyForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { companies, addCompany, updateCompany, deleteCompany } = useStore();
    const isEdit = !!id;

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<CompanyFormValues>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: "",
            licenseNo: "",
            companyType: "",
            emirates: "Dubai",
            phone1: "",
            phone2: "",
            email: "",
            isMainland: "mainland",
            remarks: "",
            transactionNo: "",
            passwords: [],
            documents: []
        },
    });

    useEffect(() => {
        if (isEdit && id) {
            const company = companies.find((c) => c._id === id);
            if (company) {
                setValue("name", company.name);
                setValue("licenseNo", company.licenseNo || "");
                setValue("companyType", company.companyType || "");
                setValue("emirates", company.emirates || "");
                setValue("phone1", company.phone1 || "");
                setValue("phone2", company.phone2 || "");
                setValue("email", company.email || "");
                setValue("isMainland", company.isMainland || "");
                setValue("remarks", company.remarks || "");
                setValue("transactionNo", company.transactionNo || "");
                // Note: Complex nested arrays might need useFieldArray if we want to edit them here
                // For now, we focusing on the main fields as per the previous form
            } else {
                navigate("/companies");
            }
        }
    }, [id, isEdit, companies, navigate, setValue]);

    const onSubmit = (data: CompanyFormValues) => {
        if (isEdit && id) {
            updateCompany(id, data);
        } else {
            addCompany({ ...data, published: true });
        }
        navigate("/companies");
    };

    const handleDelete = () => {
        if (isEdit && id) {
            if (confirm("Are you sure you want to delete this company?")) {
                deleteCompany(id);
                navigate("/companies");
            }
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/companies")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">{isEdit ? "Edit Company" : "New Company"}</h1>
                </div>
                {isEdit && (
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Company Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Company Name *</Label>
                                <Input id="name" {...register("name")} placeholder="e.g. Acme Trading LLC" />
                                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="licenseNo">License Number</Label>
                                <Input id="licenseNo" {...register("licenseNo")} placeholder="e.g. 123456" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyType">Company Type</Label>
                                <Input id="companyType" {...register("companyType")} placeholder="e.g. LLC, FZCO" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="isMainland">Jurisdiction</Label>
                                <select
                                    id="isMainland"
                                    {...register("isMainland")}
                                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                                >
                                    <option value="mainland">Mainland</option>
                                    <option value="freezone">Freezone</option>
                                    <option value="">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="emirates">Emirates/City</Label>
                                <Input id="emirates" {...register("emirates")} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" {...register("email")} />
                                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone1">Phone Number</Label>
                                <Input id="phone1" {...register("phone1")} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="remarks">Remarks</Label>
                            <textarea
                                id="remarks"
                                {...register("remarks")}
                                className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => navigate("/companies")}>Cancel</Button>
                            <Button type="submit">
                                <Save className="mr-2 h-4 w-4" /> Save Company
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
