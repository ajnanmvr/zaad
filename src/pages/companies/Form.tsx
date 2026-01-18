import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCompanySchema,
  updateCompanySchema,
  type CreateCompanyInput,
  type UpdateCompanyInput,
} from "@/lib/schemas";
import {
  useCompany,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2, Loader } from "lucide-react";

type CompanyFormValues = CreateCompanyInput | UpdateCompanyInput;

export default function CompanyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  // Queries & Mutations
  const { data: company, isLoading: isLoadingCompany } = useCompany(
    id || "",
    isEdit
  );
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(isEdit ? updateCompanySchema : createCompanySchema),
    defaultValues: {
      name: "",
      licenseNo: "",
      companyType: "",
      emirates: "",
      phone1: "",
      phone2: "",
      email: "",
      isMainland: "mainland",
      remarks: "",
      transactionNo: "",
    },
  });

  useEffect(() => {
    if (isEdit && company) {
      setValue("name", company.name);
      setValue("licenseNo", company.licenseNo || "");
      setValue("companyType", company.companyType || "");
      setValue("emirates", company.emirates || "");
      setValue("phone1", company.phone1 || "");
      setValue("phone2", company.phone2 || "");
      setValue("email", company.email || "");
      setValue("isMainland", company.isMainland || "mainland");
      setValue("remarks", company.remarks || "");
      setValue("transactionNo", company.transactionNo || "");
    }
  }, [company, isEdit, setValue]);

  const onSubmit = async (data: CompanyFormValues) => {
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, data: data as UpdateCompanyInput });
      } else {
        await createMutation.mutateAsync(data as CreateCompanyInput);
      }
      navigate("/companies");
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleDelete = async () => {
    if (isEdit && id && confirm("Are you sure you want to delete this company?")) {
      try {
        await deleteMutation.mutateAsync(id);
        navigate("/companies");
      } catch (error) {
        console.error("Error deleting company:", error);
      }
    }
  };

  if (isEdit && isLoadingCompany) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isLoading = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/companies")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? "Edit Company" : "New Company"}
          </h1>
        </div>
        {isEdit && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
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
                <Label htmlFor="name">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g. Acme Trading LLC"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNo">License Number</Label>
                <Input
                  id="licenseNo"
                  {...register("licenseNo")}
                  placeholder="e.g. 123456"
                />
                {errors.licenseNo && (
                  <p className="text-sm text-red-500">
                    {errors.licenseNo.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyType">Company Type</Label>
                <Input
                  id="companyType"
                  {...register("companyType")}
                  placeholder="e.g. LLC, FZCO"
                />
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
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="example@company.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone1">Phone Number 1</Label>
                <Input
                  id="phone1"
                  {...register("phone1")}
                  placeholder="+971 1 234 5678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone2">Phone Number 2</Label>
              <Input
                id="phone2"
                {...register("phone2")}
                placeholder="+971 1 234 5678"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transactionNo">Transaction Number</Label>
                <Input
                  id="transactionNo"
                  {...register("transactionNo")}
                  placeholder="e.g. TRN123456789"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <textarea
                id="remarks"
                {...register("remarks")}
                className="flex min-h-20 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Additional notes about the company..."
              />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/companies")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> {isEdit ? "Update" : "Create"} Company
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
