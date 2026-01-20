import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";

type DocumentFormValues = {
    name: string;
    expiryDate?: string;
    remarks?: string;
    type: string;
    ownerType: "company" | "employee" | "individual";
    ownerId: string;
};

export default function DocumentForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const documentNumberRef = useRef(`DOC-${Math.floor(Math.random() * 10000)}`);
    const isEditing = Boolean(id);
    const [formData, setFormData] = useState<DocumentFormValues>({
        name: "",
        expiryDate: "",
        remarks: "",
        type: "general",
        ownerType: "company",
        ownerId: "",
    });
    const companies: any[] = [];
    const employees: any[] = [];
    const individuals: any[] = [];

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form data:", formData, documentNumberRef.current);
        navigate(-1);
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isEditing ? "Edit Document" : "New Document"}
                    </h1>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Document Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-6">

                            <div className="space-y-2">
                                <Label htmlFor="name">Document Name *</Label>
                                <Input 
                                    id="name"
                                    placeholder="e.g. Trade License, Visa" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ownerType">Owner Type</Label>
                                    <select
                                        id="ownerType"
                                        value={formData.ownerType}
                                        onChange={(e) => setFormData({...formData, ownerType: e.target.value as any, ownerId: ""})}
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2"
                                    >
                                        <option value="company">Company</option>
                                        <option value="employee">Employee</option>
                                        <option value="individual">Individual</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ownerId">Select Owner *</Label>
                                    <select
                                        id="ownerId"
                                        value={formData.ownerId}
                                        onChange={(e) => setFormData({...formData, ownerId: e.target.value})}
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2"
                                    >
                                        <option value="">Select entity</option>
                                        {formData.ownerType === "company" && companies.map((c: any) => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                        {formData.ownerType === "employee" && employees.map((e: any) => (
                                            <option key={e._id} value={e._id}>{e.name}</option>
                                        ))}
                                        {formData.ownerType === "individual" && individuals.map((i: any) => (
                                            <option key={i._id} value={i._id}>{i.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Document Type</Label>
                                    <Input 
                                        id="type"
                                        placeholder="e.g. general" 
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiryDate">Expiry Date</Label>
                                    <Input 
                                        id="expiryDate"
                                        type="date" 
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea 
                                    id="remarks"
                                    placeholder="Any additional notes..." 
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    <Save className="mr-2 h-4 w-4" /> Save Document
                                </Button>
                            </div>
                        </form>
                </CardContent>
            </Card>
        </div>
    );
}
