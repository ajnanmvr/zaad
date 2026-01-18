# API Integration Quick Reference

## 📦 Installed Libraries
- `@tanstack/react-query` - Server state management
- `zustand` - Client state management  
- `react-hook-form` - Form state
- `zod` - Schema validation

## 📂 New Files Created

### Schemas (`/src/lib/schemas.ts`)
- `loginSchema`, `CreateUserInput`, `UpdateUserInput`
- `companySchema`, `createCompanySchema`, `updateCompanySchema`
- `employeeSchema`, `createEmployeeSchema`, `updateEmployeeSchema`
- `invoiceSchema`, `createInvoiceSchema`, `updateInvoiceSchema`
- Similar for: Individual, Document, Task, Liability, Record, ZaadExpense, Upload

### React Query Hooks (`/src/lib/queries.ts`)

#### For Each Resource:
```typescript
useXxxx()           // List with pagination
useXxx()            // Get single item
useCreateXxx()      // Create mutation
useUpdateXxx()      // Update mutation
useDeleteXxx()      // Delete mutation
```

**Examples:**
- `useCompanies()`, `useCompany()`, `useCreateCompany()`, `useUpdateCompany()`, `useDeleteCompany()`
- `useEmployees()`, `useEmployee()`, `useCreateEmployee()`, `useUpdateEmployee()`, `useDeleteEmployee()`
- `useTasks()`, `useTask()`, `useCreateTask()`, `useUpdateTask()`, `useDeleteTask()`
- And more for: Users, Invoices, Liabilities, Records, Zaad Expenses, Documents

### Zustand Stores (`/src/store/auth.ts`)
- `useAuthStore` - Authentication (login, logout, user data)
- `useCompanyStore` - Companies data + filters
- `useEmployeeStore` - Employees data + filters
- Similar stores for all resources

### API Services (`/src/lib/api-services.ts`)
Updated `uploadService`:
- `uploadSingleFile(file)` - POST `/uploads/single`
- `uploadMultipleFiles(files)` - POST `/uploads/multiple`
- `deleteFile(publicId)` - DELETE `/uploads/{publicId}`
- `getFileMetadata(publicId)` - GET `/uploads/{publicId}/metadata`

### Query Provider (`/src/lib/query-provider.tsx`)
Wraps app with React Query client setup

## 🎯 Usage Patterns

### **Pattern 1: List Page with Filtering**
```typescript
import { useCompanies } from "@/lib/queries";

function CompanyList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useCompanies({
    page,
    limit: 10,
    search: searchTerm,
    sortBy: "name",
    sortOrder: "asc",
  });

  return (
    <>
      {isLoading && <Loader />}
      {error && <Error message={error.message} />}
      {data?.companies.map(company => (
        <CompanyRow key={company._id} company={company} />
      ))}
    </>
  );
}
```

### **Pattern 2: Form with Create/Update**
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCompanySchema } from "@/lib/schemas";
import { useCreateCompany, useUpdateCompany } from "@/lib/queries";

function CompanyForm({ id }) {
  const isEdit = !!id;
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createCompanySchema),
  });

  const onSubmit = async (data) => {
    if (isEdit) {
      await updateMutation.mutateAsync({ id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      {errors.name && <span>{errors.name.message}</span>}
      <button disabled={createMutation.isPending}>Save</button>
    </form>
  );
}
```

### **Pattern 3: Authentication**
```typescript
import { useAuthStore } from "@/store/auth";

function LoginPage() {
  const { login, user, isLoading, error } = useAuthStore();

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
      // User is now logged in
    } catch (err) {
      // Handle error
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleLogin(email, password);
    }}>
      {/* form fields */}
    </form>
  );
}
```

## 🔄 Cache Invalidation

React Query automatically invalidates caches:
- After `useCreateCompany()` → invalidates `useCompanies()`
- After `useUpdateCompany()` → invalidates `useCompanies()` and `useCompany(id)`
- After `useDeleteCompany()` → invalidates `useCompanies()`

## ❗ Important Notes

1. **API Endpoints**: All endpoints must be implemented in backend
2. **Auth Token**: Automatically included in all requests from `api-client.ts`
3. **Error Handling**: API errors are caught and thrown, use try-catch in components
4. **Loading States**: Use `isPending` for mutations, `isLoading` for queries
5. **Type Safety**: All inputs/outputs are validated with Zod

## 🚀 Quick Start for New Resource

1. Add schemas in `/src/lib/schemas.ts`:
```typescript
export const myResourceSchema = z.object({...});
export const createMyResourceSchema = z.object({...});
export const updateMyResourceSchema = createMyResourceSchema.partial();
```

2. Add service in `/src/lib/api-services.ts`:
```typescript
export const myResourceService = {
  async getAll(params) { return apiClient.get("/my-resource", { params }); },
  async getOne(id) { return apiClient.get(`/my-resource/${id}`); },
  async create(data) { return apiClient.post("/my-resource", data); },
  async update(id, data) { return apiClient.patch(`/my-resource/${id}`, data); },
  async delete(id) { return apiClient.delete(`/my-resource/${id}`); },
};
```

3. Add hooks in `/src/lib/queries.ts`:
```typescript
export const useMyResources = (params, enabled = true) => {
  return useQuery({
    queryKey: ["my-resource", params],
    queryFn: () => myResourceService.getAll(params),
    enabled,
  });
};
// ... add other hooks following the pattern
```

4. Add store in `/src/store/auth.ts`:
```typescript
export const useMyResourceStore = createDataStore();
```

5. Use in components following the patterns above!

---

## 📞 Support

Check `/docs/IMPLEMENTATION_GUIDE.md` for:
- Complete list of missing backend APIs
- Implementation priority
- Detailed usage examples
