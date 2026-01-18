import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  authService,
  userService,
  companyService,
  employeeService,
  individualService,
  documentService,
  taskService,
  invoiceService,
  liabilityService,
  recordService,
  zaadExpenseService,
  uploadService,
} from "./api-services";
import type {
  CreateUserInput,
  CreateCompanyInput,
  CreateEmployeeInput,
  CreateIndividualInput,
  CreateDocumentInput,
  CreateTaskInput,
  CreateInvoiceInput,
  CreateLiabilityInput,
  CreateRecordInput,
  CreateZaadExpenseInput,
  UpdateUserInput,
  UpdateCompanyInput,
  UpdateEmployeeInput,
  UpdateIndividualInput,
  UpdateDocumentInput,
  UpdateTaskInput,
  UpdateInvoiceInput,
  UpdateLiabilityInput,
  UpdateRecordInput,
  UpdateZaadExpenseInput,
} from "./schemas";

// ==================== AUTH QUERIES ====================

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authService.getCurrentUser(),
    retry: false,
  });
};

// ==================== USER QUERIES & MUTATIONS ====================

export const useUsers = (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  enabled = true
) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => userService.getUsers(params),
    enabled,
  });
};

export const useUser = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => userService.getUser(id),
    enabled,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: CreateUserInput) => userService.createUser(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      userService.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", id] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// ==================== COMPANY QUERIES & MUTATIONS ====================

export const useCompanies = (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  enabled = true
) => {
  return useQuery({
    queryKey: ["companies", params],
    queryFn: () => companyService.getCompanies(params),
    enabled,
  });
};

export const useCompany = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ["companies", id],
    queryFn: () => companyService.getCompany(id),
    enabled,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: CreateCompanyInput) => companyService.createCompany(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyInput }) =>
      companyService.updateCompany(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies", id] });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companyService.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
};

// ==================== EMPLOYEE QUERIES & MUTATIONS ====================

export const useEmployees = (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    company?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  enabled = true
) => {
  return useQuery({
    queryKey: ["employees", params],
    queryFn: () => employeeService.getEmployees(params),
    enabled,
  });
};

export const useEmployee = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ["employees", id],
    queryFn: () => employeeService.getEmployee(id),
    enabled,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: CreateEmployeeInput) => employeeService.createEmployee(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeInput }) =>
      employeeService.updateEmployee(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees", id] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};

// ==================== INDIVIDUAL QUERIES & MUTATIONS ====================

export const useIndividuals = (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  enabled = true
) => {
  return useQuery({
    queryKey: ["individuals", params],
    queryFn: () => individualService.getIndividuals(params),
    enabled,
  });
};

export const useIndividual = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ["individuals", id],
    queryFn: () => individualService.getIndividual(id),
    enabled,
  });
};

export const useCreateIndividual = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: CreateIndividualInput) => individualService.createIndividual(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["individuals"] });
    },
  });
};

export const useUpdateIndividual = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIndividualInput }) =>
      individualService.updateIndividual(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["individuals"] });
      queryClient.invalidateQueries({ queryKey: ["individuals", id] });
    },
  });
};

export const useDeleteIndividual = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => individualService.deleteIndividual(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["individuals"] });
    },
  });
};

// ==================== DOCUMENT QUERIES & MUTATIONS ====================

export const useDocuments = (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    owner?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  enabled = true
) => {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => documentService.getDocuments(params),
    enabled,
  });
};

export const useDocument = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: () => documentService.getDocument(id),
    enabled,
  });
};

export const useExpiringDocuments = (params?: { days?: number }, enabled = true) => {
  return useQuery({
    queryKey: ["documents", "expiring", params],
    queryFn: () => documentService.getExpiringDocuments(params),
    enabled,
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: CreateDocumentInput) => documentService.createDocument(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["documents", "expiring"] });
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentInput }) =>
      documentService.updateDocument(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["documents", id] });
      queryClient.invalidateQueries({ queryKey: ["documents", "expiring"] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["documents", "expiring"] });
    },
  });
};

// ==================== TASK QUERIES & MUTATIONS ====================

export const useTasks = (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  enabled = true
) => {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => taskService.getTasks(params),
    enabled,
  });
};

export const useTask = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => taskService.getTask(id),
    enabled,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: CreateTaskInput) => taskService.createTask(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      taskService.updateTask(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

// ==================== INVOICE QUERIES & MUTATIONS ====================

export const useInvoices = (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    company?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  enabled = true
) => {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoiceService.getInvoices(params),
    enabled,
  });
};

export const useInvoice = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => invoiceService.getInvoice(id),
    enabled,
  });
};

export const useOverdueInvoices = (params?: { days?: number }, enabled = true) => {
  return useQuery({
    queryKey: ["invoices", "overdue", params],
    queryFn: () => invoiceService.getOverdueInvoices(params),
    enabled,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: CreateInvoiceInput) => invoiceService.createInvoice(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", "overdue"] });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceInput }) =>
      invoiceService.updateInvoice(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices", "overdue"] });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceService.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", "overdue"] });
    },
  });
};

// ==================== LIABILITY QUERIES & MUTATIONS ====================

export const useLiabilities = (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  enabled = true
) => {
  return useQuery({
    queryKey: ["liabilities", params],
    queryFn: () => liabilityService.getLiabilities(params),
    enabled,
  });
};

export const useLiability = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ["liabilities", id],
    queryFn: () => liabilityService.getLiability(id),
    enabled,
  });
};

export const useCreateLiability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: CreateLiabilityInput) => liabilityService.createLiability(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liabilities"] });
    },
  });
};

export const useUpdateLiability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLiabilityInput }) =>
      liabilityService.updateLiability(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["liabilities"] });
      queryClient.invalidateQueries({ queryKey: ["liabilities", id] });
    },
  });
};

export const useDeleteLiability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liabilityService.deleteLiability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liabilities"] });
    },
  });
};

// ==================== RECORD QUERIES & MUTATIONS ====================

export const useRecords = (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  enabled = true
) => {
  return useQuery({
    queryKey: ["records", params],
    queryFn: () => recordService.getRecords(params),
    enabled,
  });
};

export const useRecord = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ["records", id],
    queryFn: () => recordService.getRecord(id),
    enabled,
  });
};

export const useCreateRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: CreateRecordInput) => recordService.createRecord(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
    },
  });
};

export const useUpdateRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecordInput }) =>
      recordService.updateRecord(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      queryClient.invalidateQueries({ queryKey: ["records", id] });
    },
  });
};

export const useDeleteRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recordService.deleteRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
    },
  });
};

// ==================== ZAAD EXPENSE QUERIES & MUTATIONS ====================

export const useZaadExpenses = (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  enabled = true
) => {
  return useQuery({
    queryKey: ["zaad-expenses", params],
    queryFn: () => zaadExpenseService.getExpenses(params),
    enabled,
  });
};

export const useZaadExpense = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ["zaad-expenses", id],
    queryFn: () => zaadExpenseService.getExpense(id),
    enabled,
  });
};

export const useCreateZaadExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: CreateZaadExpenseInput) => zaadExpenseService.createExpense(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zaad-expenses"] });
    },
  });
};

export const useUpdateZaadExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateZaadExpenseInput }) =>
      zaadExpenseService.updateExpense(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["zaad-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["zaad-expenses", id] });
    },
  });
};

export const useDeleteZaadExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => zaadExpenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zaad-expenses"] });
    },
  });
};

// ==================== UPLOAD MUTATIONS ====================

export const useUploadSingleFile = () => {
  return useMutation({
    mutationFn: (file: File) => uploadService.uploadSingleFile(file),
  });
};

export const useUploadMultipleFiles = () => {
  return useMutation({
    mutationFn: (files: File[]) => uploadService.uploadMultipleFiles(files),
  });
};

export const useDeleteFile = () => {
  return useMutation({
    mutationFn: (publicId: string) => uploadService.deleteFile(publicId),
  });
};

export const useGetFileMetadata = (publicId: string, enabled = true) => {
  return useQuery({
    queryKey: ["file-metadata", publicId],
    queryFn: () => uploadService.getFileMetadata(publicId),
    enabled,
  });
};
