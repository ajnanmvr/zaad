import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStore } from "@/store";
import { employeeSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EmployeeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { employees, companies, addEmployee, updateEmployee, deleteEmployee } = useStore();
    const isEdit = !!id;

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema) as any,
        defaultValues: {
            name: "",
            company: "",
            isActive: true,
            emiratesId: "",
            nationality: "",
            phone1: "",
            phone2: "",
            email: "",
            designation: "",
            remarks: "",
        },
    });

    useEffect(() => {
        if (isEdit && id) {
            const employee = employees.find((e) => e._id === id);
            if (employee) {
                setValue("name", employee.name);
                setValue("company", employee.company || "");
                setValue("isActive", employee.isActive);
                setValue("emiratesId", employee.emiratesId || "");
                setValue("nationality", employee.nationality || "");
                setValue("phone1", employee.phone1 || "");
                setValue("phone2", employee.phone2 || "");
                setValue("email", employee.email || "");
                setValue("designation", employee.designation || "");
                setValue("remarks", employee.remarks || "");
            } else {
                navigate("/employees");
            }
        }
    }, [id, isEdit, employees, navigate, setValue]);

    const onSubmit = (data: EmployeeFormValues) => {
        if (isEdit && id) {
            updateEmployee(id, data);
        } else {
            addEmployee({ ...data, published: true });
        }
        navigate("/employees");
    };

    const handleDelete = () => {
        if (isEdit && id) {
            if (confirm("Are you sure you want to delete this employee?")) {
                deleteEmployee(id);
                navigate("/employees");
            }
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/employees")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">{isEdit ? "Edit Employee" : "New Employee"}</h1>
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
                        <CardTitle>Employee Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input id="name" {...register("name")} />
                                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <select
                                    id="company"
                                    {...register("company")}
                                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                                >
                                    <option value="">Select Company</option>
                                    {companies.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="designation">Designation</Label>
                                <Input id="designation" {...register("designation")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nationality">Nationality</Label>
                                <Input id="nationality" {...register("nationality")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="isActive">Status</Label>
                                <select
                                    id="isActive"
                                    {...register("isActive", {
                                        setValueAs: (value: string) => value === "true",
                                    })}
                                    defaultValue={isEdit ? undefined : "true"}
                                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
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
                            <Label htmlFor="emiratesId">Emirates ID</Label>
                            <Input id="emiratesId" {...register("emiratesId")} />
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
                            <Button type="button" variant="outline" onClick={() => navigate("/employees")}>Cancel</Button>
                            <Button type="submit">
                                <Save className="mr-2 h-4 w-4" /> Save Employee
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
