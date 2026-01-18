import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStore } from "@/store";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect } from "react";

const documentSchema = z.object({
    name: z.string().min(1, "Document Name is required"),
    expiryDate: z.string().optional(),
    remarks: z.string().optional(),
    type: z.string().min(1, "Document Type is required"), // e.g., 'visa', 'license'
    ownerType: z.enum(["company", "employee", "individual"] as const),
    ownerId: z.string().min(1, "Owner is required"),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

export default function DocumentForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { documents, addDocument, updateDocument, companies, employees, individuals } = useStore();

    const isEditing = Boolean(id);
    const existingDoc = documents.find((d) => d._id === id);

    const form = useForm<DocumentFormValues>({
        resolver: zodResolver(documentSchema),
        defaultValues: {
            name: "",
            expiryDate: "",
            remarks: "",
            type: "general",
            ownerType: "company",
            ownerId: "",
        },
    });

    // Populate form if editing
    useEffect(() => {
        if (isEditing && existingDoc) {
            let ownerType: "company" | "employee" | "individual" = "company";
            let ownerId = "";

            if (existingDoc.company) {
                ownerType = "company";
                ownerId = existingDoc.company;
            } else if (existingDoc.employee) {
                ownerType = "employee";
                ownerId = existingDoc.employee;
            } else if (existingDoc.individual) {
                ownerType = "individual";
                ownerId = existingDoc.individual;
            }

            form.reset({
                name: existingDoc.name,
                expiryDate: existingDoc.expiryDate,
                remarks: existingDoc.remarks,
                type: existingDoc.type,
                ownerType,
                ownerId,
            });
        }
    }, [isEditing, existingDoc, form]);

    const ownerType = useWatch({ control: form.control, name: "ownerType" });

    const onSubmit = (data: DocumentFormValues) => {
        // Prepare data matching IDocument
        const docData = {
            name: data.name,
            expiryDate: data.expiryDate,
            remarks: data.remarks,
            type: data.type,
            company: data.ownerType === "company" ? data.ownerId : undefined,
            employee: data.ownerType === "employee" ? data.ownerId : undefined,
            individual: data.ownerType === "individual" ? data.ownerId : undefined,
            issueDate: new Date().toISOString(),
            status: 'valid' as const,
            documentNumber: 'DOC-' + Math.floor(Math.random() * 10000),
            published: true,
        };

        if (isEditing && id) {
            updateDocument(id, docData);
        } else {
            addDocument(docData);
        }
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
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Document Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Trade License, Visa" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="ownerType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Owner Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="company">Company</SelectItem>
                                                    <SelectItem value="employee">Employee</SelectItem>
                                                    <SelectItem value="individual">Individual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="ownerId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Select Owner *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select entity" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {ownerType === "company" && companies.map((c) => (
                                                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                                    ))}
                                                    {ownerType === "employee" && employees.map((e) => (
                                                        <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>
                                                    ))}
                                                    {ownerType === "individual" && individuals.map((i) => (
                                                        <SelectItem key={i._id} value={i._id}>{i.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Document Type</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. general" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="expiryDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expiry Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="remarks"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Remarks</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Any additional notes..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    <Save className="mr-2 h-4 w-4" /> Save Document
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
