import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

interface EmployeeFormData {
    name: string;
    company: string;
    isActive: boolean;
    emiratesId: string;
    nationality: string;
    phone1: string;
    phone2: string;
    email: string;
    designation: string;
    remarks: string;
}

export default function EmployeeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    const [formData, setFormData] = useState<EmployeeFormData>({
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
    });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form data:", formData);
        navigate("/employees");
    };

    const handleDelete = () => {
        if (isEdit && id) {
            if (confirm("Are you sure you want to delete this employee?")) {
                console.log("Delete employee:", id);
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

            <form onSubmit={onSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Employee Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input 
                                    id="name" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <Input 
                                    id="company" 
                                    value={formData.company}
                                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="designation">Designation</Label>
                                <Input 
                                    id="designation" 
                                    value={formData.designation}
                                    onChange={(e) => setFormData({...formData, designation: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nationality">Nationality</Label>
                                <Input 
                                    id="nationality" 
                                    value={formData.nationality}
                                    onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="isActive">Status</Label>
                                <select
                                    id="isActive"
                                    value={formData.isActive ? "true" : "false"}
                                    onChange={(e) => setFormData({...formData, isActive: e.target.value === "true"})}
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
                                className="flex min-h-20 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
