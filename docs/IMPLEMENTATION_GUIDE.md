# Zaad v2.0 - API Integration & Frontend Setup Guide

## ✅ Completed Frontend Setup

### 1. **Dependencies Installed**
- ✅ `@tanstack/react-query` - Server state management and caching
- ✅ `zustand` - Client state management (auth store created)
- ✅ `react-hook-form` - Form state management (already installed)
- ✅ `zod` - Schema validation (already installed)

### 2. **File Structure Created**

#### `/src/lib/`
- **`schemas.ts`** - Comprehensive Zod validation schemas for all resources:
  - Auth schemas (login, refresh)
  - User, Company, Employee, Individual schemas
  - Document, Task, Invoice, Liability, Record, ZaadExpense schemas
  - Upload schemas
  - Each with Create, Update, and base type definitions

- **`queries.ts`** - React Query hooks for all resources:
  - `useCurrentUser()` - Get authenticated user
  - `useUsers()`, `useUser()`, `useCreateUser()`, `useUpdateUser()`, `useDeleteUser()`
  - `useCompanies()`, `useCompany()`, `useCreateCompany()`, `useUpdateCompany()`, `useDeleteCompany()`
  - Similar hooks for all other resources
  - Query auto-invalidation on mutations for cache freshness

- **`api-services.ts`** - Updated upload service with Cloudinary endpoints:
  - `uploadSingleFile()` - POST `/uploads/single`
  - `uploadMultipleFiles()` - POST `/uploads/multiple`
  - `deleteFile()` - DELETE `/uploads/{publicId}`
  - `getFileMetadata()` - GET `/uploads/{publicId}/metadata`

- **`query-provider.tsx`** - QueryClient setup with optimal defaults

#### `/src/store/`
- **`auth.ts`** - Zustand stores:
  - `useAuthStore` - Authentication state (user, login, logout, getCurrentUser)
  - `createDataStore()` - Generic reusable data store factory
  - Pre-configured stores for all resources (Company, Employee, etc.)

#### Enhanced Components
- **`/src/pages/companies/Form.tsx`** - Refactored to use:
  - React Hook Form with Zod validation
  - React Query mutations for create/update/delete
  - Proper loading and error states
  - Auto-population of form fields from API

#### `/src/App.tsx`
- Wrapped with `QueryProvider` for React Query support

### 3. **API Response Format**
All queries follow the established pattern:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

---

## ❌ Missing Backend APIs (Need to Implement)

### **CRITICAL - Must Implement**

#### 1. **Authentication Endpoints** (Base: `/api/v1/auth`)
```
POST   /auth/login              ✅ Exists
POST   /auth/refresh            ✅ Exists
POST   /auth/logout             ✅ Exists
POST   /auth/logout-all         ✅ Exists
GET    /auth/me                 ✅ Exists
POST   /auth/change-password    ❌ MISSING
POST   /auth/forgot-password    ❌ MISSING
POST   /auth/reset-password     ❌ MISSING
POST   /auth/verify-email       ❌ MISSING
```

#### 2. **Companies Endpoints** (Base: `/api/v1/companies`)
```
GET    /companies               ❌ MISSING (list with pagination)
GET    /companies/:id           ❌ MISSING (get single)
POST   /companies               ❌ MISSING (create)
PATCH  /companies/:id           ❌ MISSING (update)
DELETE /companies/:id           ❌ MISSING (delete)
GET    /companies/:id/employees ❌ MISSING (get company employees)
GET    /companies/search        ❌ MISSING (search by name/license)
```

#### 3. **Employees Endpoints** (Base: `/api/v1/employees`)
```
GET    /employees               ❌ MISSING (list with pagination)
GET    /employees/:id           ❌ MISSING (get single)
POST   /employees               ❌ MISSING (create)
PATCH  /employees/:id           ❌ MISSING (update)
DELETE /employees/:id           ❌ MISSING (delete)
GET    /employees/company/:id   ❌ MISSING (get by company)
GET    /employees/search        ❌ MISSING (search)
```

#### 4. **Individuals Endpoints** (Base: `/api/v1/individuals`)
```
GET    /individuals             ❌ MISSING
GET    /individuals/:id         ❌ MISSING
POST   /individuals             ❌ MISSING
PATCH  /individuals/:id         ❌ MISSING
DELETE /individuals/:id         ❌ MISSING
GET    /individuals/search      ❌ MISSING
```

#### 5. **Documents Endpoints** (Base: `/api/v1/documents`)
```
GET    /documents               ❌ MISSING (list with pagination)
GET    /documents/:id           ❌ MISSING (get single)
POST   /documents               ❌ MISSING (create)
PATCH  /documents/:id           ❌ MISSING (update)
DELETE /documents/:id           ❌ MISSING (delete)
GET    /documents/expiring      ❌ MISSING (documents expiring in N days)
GET    /documents/expired       ❌ MISSING (already expired)
```

#### 6. **Tasks Endpoints** (Base: `/api/v1/tasks`)
```
GET    /tasks                   ❌ MISSING (list with pagination)
GET    /tasks/:id               ❌ MISSING (get single)
POST   /tasks                   ❌ MISSING (create)
PATCH  /tasks/:id               ❌ MISSING (update)
DELETE /tasks/:id               ❌ MISSING (delete)
GET    /tasks/assigned-to-me    ❌ MISSING
PATCH  /tasks/:id/status        ❌ MISSING (bulk status update)
```

#### 7. **Invoices Endpoints** (Base: `/api/v1/invoices`)
```
GET    /invoices                ❌ MISSING (list with pagination)
GET    /invoices/:id            ❌ MISSING (get single)
POST   /invoices                ❌ MISSING (create)
PATCH  /invoices/:id            ❌ MISSING (update)
DELETE /invoices/:id            ❌ MISSING (delete)
GET    /invoices/overdue        ❌ MISSING (invoices past due date)
GET    /invoices/by-status      ❌ MISSING (filter by status)
GET    /invoices/:id/pdf        ❌ MISSING (generate/download PDF)
```

#### 8. **Liabilities Endpoints** (Base: `/api/v1/liabilities`)
```
GET    /liabilities             ❌ MISSING (list with pagination)
GET    /liabilities/:id         ❌ MISSING (get single)
POST   /liabilities             ❌ MISSING (create)
PATCH  /liabilities/:id         ❌ MISSING (update)
DELETE /liabilities/:id         ❌ MISSING (delete)
GET    /liabilities/by-type     ❌ MISSING (filter by type)
PATCH  /liabilities/:id/pay     ❌ MISSING (mark as paid/partial)
```

#### 9. **Records Endpoints** (Base: `/api/v1/records`)
```
GET    /records                 ❌ MISSING (list with pagination)
GET    /records/:id             ❌ MISSING (get single)
POST   /records                 ❌ MISSING (create)
PATCH  /records/:id             ❌ MISSING (update)
DELETE /records/:id             ❌ MISSING (delete)
GET    /records/by-type         ❌ MISSING (filter income/expense)
```

#### 10. **Zaad Expenses Endpoints** (Base: `/api/v1/zaad-expenses`)
```
GET    /zaad-expenses           ❌ MISSING (list with pagination)
GET    /zaad-expenses/:id       ❌ MISSING (get single)
POST   /zaad-expenses           ❌ MISSING (create)
PATCH  /zaad-expenses/:id       ❌ MISSING (update)
DELETE /zaad-expenses/:id       ❌ MISSING (delete)
GET    /zaad-expenses/by-category ❌ MISSING (filter by category)
```

#### 11. **Users Endpoints** (Base: `/api/v1/users`)
```
GET    /users                   ✅ Exists (according to swagger)
GET    /users/:id               ✅ Exists
POST   /users                   ✅ Exists
PATCH  /users/:id               ✅ Exists (swagger uses PATCH)
DELETE /users/:id               ✅ Exists
GET    /users/:id/activities    ❌ MISSING (user activity log)
```

#### 12. **Analytics/Dashboard Endpoints** (Base: `/api/v1/analytics`)
```
GET    /analytics/dashboard     ❌ MISSING (dashboard stats)
GET    /analytics/cash-flow     ❌ MISSING (cash flow report)
GET    /analytics/expense-report ❌ MISSING (expense breakdown)
GET    /analytics/invoice-summary ❌ MISSING (invoice stats)
```

---

## 📋 **Implementation Checklist for Backend**

### Priority 1 - Core CRUD Operations (Week 1)
- [ ] Companies (5 endpoints)
- [ ] Employees (5 endpoints)
- [ ] Individuals (5 endpoints)

### Priority 2 - Financial Operations (Week 2)
- [ ] Invoices (7 endpoints)
- [ ] Liabilities (6 endpoints)
- [ ] Records (5 endpoints)

### Priority 3 - Supporting Operations (Week 3)
- [ ] Documents (7 endpoints)
- [ ] Tasks (6 endpoints)
- [ ] Zaad Expenses (6 endpoints)

### Priority 4 - Advanced Features (Week 4)
- [ ] Authentication enhancements (password reset, email verification)
- [ ] Analytics endpoints
- [ ] File metadata operations
- [ ] PDF generation for invoices

---

## 🔧 **Usage Examples**

### Using React Query for Data Fetching
```typescript
import { useCompanies, useCreateCompany, useUpdateCompany } from "@/lib/queries";

function MyComponent() {
  // Fetch list of companies
  const { data, isLoading, error } = useCompanies({
    page: 1,
    limit: 10,
    search: "acme",
  });

  // Create mutation
  const createMutation = useCreateCompany();
  const handleCreate = async (data) => {
    await createMutation.mutateAsync(data);
    // Cache auto-invalidates
  };

  // Update mutation
  const updateMutation = useUpdateCompany();
  const handleUpdate = async (id, data) => {
    await updateMutation.mutateAsync({ id, data });
  };
}
```

### Using React Hook Form with Zod
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCompanySchema } from "@/lib/schemas";

function CompanyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createCompanySchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  );
}
```

### Using Zustand Auth Store
```typescript
import { useAuthStore } from "@/store/auth";

function LoginPage() {
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async (email, password) => {
    await login(email, password);
  };
}
```

---

## 📚 **Additional Components to Update**

### Forms to Migrate (Follow Company Form pattern):
- [ ] `Employee Form` - useEmployees, useCreateEmployee, useUpdateEmployee
- [ ] `Individual Form` - useIndividuals, useCreateIndividual, useUpdateIndividual
- [ ] `Invoice Form` - useInvoices, useCreateInvoice, useUpdateInvoice
- [ ] `Task Form` - useTasks, useCreateTask, useUpdateTask
- [ ] `Document Form` - useDocuments, useCreateDocument, useUpdateDocument
- [ ] `Liability Form` - useLiabilities, useCreateLiability, useUpdateLiability
- [ ] `Record Form` - useRecords, useCreateRecord, useUpdateRecord
- [ ] `ZaadExpense Form` - useZaadExpenses, useCreateZaadExpense, useUpdateZaadExpense
- [ ] `User Form` - useUsers, useCreateUser, useUpdateUser

### Lists to Migrate:
- [ ] `Company List` - Add filtering, sorting, pagination via useCompanies
- [ ] `Employee List` - Similar pattern
- [ ] `Task List` - Add status filtering
- [ ] `Invoice List` - Add status filtering, overdue indicator
- [ ] All other list pages

---

## 🎯 **Next Steps**

1. **Backend Development**: Start implementing endpoints from Priority 1
2. **Form Migration**: Update remaining forms following Company Form pattern
3. **List Pages**: Migrate list pages to use React Query
4. **Error Handling**: Add global error boundaries and toast notifications
5. **Loading States**: Add skeleton loaders for list pages
6. **Optimistic Updates**: Consider optimistic updates for better UX

---

## 📞 **API Base URL Configuration**

Environment variables are loaded from `.env.local`:
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

For production:
```
VITE_API_BASE_URL=https://api.zaad.com/api/v1
```

---

## ✨ **Benefits of Current Setup**

- ✅ **Type-safe** - Zod schemas ensure validation
- ✅ **Automatic caching** - React Query handles stale data
- ✅ **Easy to use** - Simple, consistent API
- ✅ **Scalable** - Easy to add new resources
- ✅ **Error handling** - Centralized in API client
- ✅ **Form validation** - Real-time validation with Zod
- ✅ **State management** - Zustand for client state, React Query for server state
