import { z } from "zod";

// ==================== AUTH SCHEMAS ====================
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ==================== USER SCHEMAS ====================
export const userSchema = z.object({
  _id: z.string(),
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
  roleIds: z.array(z.string()).optional(),
  lastLogin: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof userSchema>;

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleIds: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  roleIds: z.array(z.string()).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ==================== COMPANY SCHEMAS ====================
export const companySchema = z.object({
  _id: z.string(),
  name: z.string().min(1, "Company name is required"),
  licenseNo: z.string().optional(),
  companyType: z.string().optional(),
  emirates: z.string().optional(),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  transactionNo: z.string().optional(),
  isMainland: z.enum(["mainland", "freezone", ""]).optional(),
  remarks: z.string().optional(),
  published: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Company = z.infer<typeof companySchema>;

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  licenseNo: z.string().optional(),
  companyType: z.string().optional(),
  emirates: z.string().optional(),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  transactionNo: z.string().optional(),
  isMainland: z.enum(["mainland", "freezone", ""]).optional(),
  remarks: z.string().optional(),
});
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = createCompanySchema.partial();
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

// ==================== EMPLOYEE SCHEMAS ====================
export const employeeSchema = z.object({
  _id: z.string(),
  name: z.string().min(1, "Employee name is required"),
  company: z.string().optional(),
  isActive: z.boolean().default(true),
  emiratesId: z.string().optional(),
  nationality: z.string().optional(),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  designation: z.string().optional(),
  remarks: z.string().optional(),
  published: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Employee = z.infer<typeof employeeSchema>;

export const createEmployeeSchema = z.object({
  name: z.string().min(1, "Employee name is required"),
  company: z.string().optional(),
  isActive: z.boolean().default(true),
  emiratesId: z.string().optional(),
  nationality: z.string().optional(),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  designation: z.string().optional(),
  remarks: z.string().optional(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial();
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

// ==================== INDIVIDUAL SCHEMAS ====================
export const individualSchema = z.object({
  _id: z.string(),
  name: z.string().min(1, "Name is required"),
  nationality: z.string().optional(),
  passportNo: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  remarks: z.string().optional(),
  published: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Individual = z.infer<typeof individualSchema>;

export const createIndividualSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nationality: z.string().optional(),
  passportNo: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  remarks: z.string().optional(),
});
export type CreateIndividualInput = z.infer<typeof createIndividualSchema>;

export const updateIndividualSchema = createIndividualSchema.partial();
export type UpdateIndividualInput = z.infer<typeof updateIndividualSchema>;

// ==================== DOCUMENT SCHEMAS ====================
export const documentSchema = z.object({
  _id: z.string(),
  company: z.string().optional(),
  employee: z.string().optional(),
  individual: z.string().optional(),
  name: z.string().min(1, "Document name is required"),
  type: z.string().min(1, "Document type is required"),
  expiryDate: z.string().datetime().optional(),
  file: z.string().optional(),
  remarks: z.string().optional(),
  published: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  daysUntil: z.number().optional(),
  status: z.enum(["expired", "expiring", "valid"]).optional(),
});
export type Document = z.infer<typeof documentSchema>;

export const createDocumentSchema = z.object({
  company: z.string().optional(),
  employee: z.string().optional(),
  individual: z.string().optional(),
  name: z.string().min(1, "Document name is required"),
  type: z.string().min(1, "Document type is required"),
  expiryDate: z.string().datetime().optional(),
  file: z.string().optional(),
  remarks: z.string().optional(),
});
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

export const updateDocumentSchema = createDocumentSchema.partial();
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

// ==================== TASK SCHEMAS ====================
export const taskSchema = z.object({
  _id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  createdBy: z.string(),
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().datetime().optional(),
  published: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Task = z.infer<typeof taskSchema>;

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().datetime().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// ==================== INVOICE SCHEMAS ====================
export const invoiceItemSchema = z.object({
  title: z.string().optional(),
  desc: z.string().optional(),
  rate: z.coerce.number().optional(),
  quantity: z.coerce.number().optional(),
});
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

export const invoiceSchema = z.object({
  _id: z.string(),
  invoiceNo: z.number(),
  title: z.string().optional(),
  suffix: z.string().optional(),
  client: z.string().optional(),
  company: z.string().optional(),
  individual: z.string().optional(),
  location: z.string().optional(),
  trn: z.string().optional(),
  purpose: z.string().optional(),
  advance: z.coerce.number().default(0),
  showBalance: z.string().optional(),
  amount: z.coerce.number(),
  tax: z.coerce.number().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue"]).default("draft"),
  date: z.string(),
  validTo: z.string().optional(),
  quotation: z.boolean().optional(),
  message: z.string().optional(),
  remarks: z.string().optional(),
  createdBy: z.string().optional(),
  items: z.array(invoiceItemSchema).optional(),
  published: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Invoice = z.infer<typeof invoiceSchema>;

export const createInvoiceSchema = z.object({
  invoiceNo: z.coerce.number().min(1, "Invoice number is required"),
  title: z.string().optional(),
  suffix: z.string().optional(),
  client: z.string().optional(),
  company: z.string().optional(),
  individual: z.string().optional(),
  location: z.string().optional(),
  trn: z.string().optional(),
  purpose: z.string().optional(),
  advance: z.coerce.number().default(0),
  showBalance: z.string().optional(),
  amount: z.coerce.number().min(0, "Amount must be greater than 0"),
  tax: z.coerce.number().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue"]).default("draft"),
  date: z.string(),
  validTo: z.string().optional(),
  quotation: z.boolean().optional(),
  message: z.string().optional(),
  remarks: z.string().optional(),
  items: z.array(invoiceItemSchema).optional(),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceSchema = createInvoiceSchema.partial();
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

// ==================== LIABILITY SCHEMAS ====================
export const liabilitySchema = z.object({
  _id: z.string(),
  type: z.enum(["payable", "receivable", "loan", "credit", "debit", "other"]),
  amount: z.coerce.number().min(0),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["pending", "partial", "paid", "active", "closed", "overdue"]).default("pending"),
  dueDate: z.string().optional(),
  company: z.string().optional(),
  individual: z.string().optional(),
  remarks: z.string().optional(),
  paidAmount: z.coerce.number().default(0),
  published: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Liability = z.infer<typeof liabilitySchema>;

export const createLiabilitySchema = z.object({
  type: z.enum(["payable", "receivable", "loan", "credit", "debit", "other"]),
  amount: z.coerce.number().min(0, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["pending", "partial", "paid", "active", "closed", "overdue"]).default("pending"),
  dueDate: z.string().optional(),
  company: z.string().optional(),
  individual: z.string().optional(),
  remarks: z.string().optional(),
  paidAmount: z.coerce.number().optional(),
});
export type CreateLiabilityInput = z.infer<typeof createLiabilitySchema>;

export const updateLiabilitySchema = createLiabilitySchema.partial();
export type UpdateLiabilityInput = z.infer<typeof updateLiabilitySchema>;

// ==================== RECORD SCHEMAS ====================
export const recordSchema = z.object({
  _id: z.string(),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().min(0),
  particular: z.string().min(1, "Particular is required"),
  category: z.string().optional(),
  method: z
    .enum(["bank", "cash", "tasdeed", "swiper", "service fee", "liability"])
    .optional(),
  date: z.string(),
  status: z.enum(["cleared", "pending", "rejected"]).optional(),
  company: z.string().optional(),
  individual: z.string().optional(),
  invoiceNo: z.union([z.string(), z.number()]).optional(),
  remarks: z.string().optional(),
  published: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Record = z.infer<typeof recordSchema>;

export const createRecordSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().min(0, "Amount must be greater than 0"),
  particular: z.string().min(1, "Particular is required"),
  category: z.string().optional(),
  method: z
    .enum(["bank", "cash", "tasdeed", "swiper", "service fee", "liability"])
    .optional(),
  date: z.string(),
  status: z.enum(["cleared", "pending", "rejected"]).optional(),
  company: z.string().optional(),
  individual: z.string().optional(),
  invoiceNo: z.union([z.string(), z.number()]).optional(),
  remarks: z.string().optional(),
});
export type CreateRecordInput = z.infer<typeof createRecordSchema>;

export const updateRecordSchema = createRecordSchema.partial();
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;

// ==================== ZAAD EXPENSE SCHEMAS ====================
export const zaadExpenseSchema = z.object({
  _id: z.string(),
  title: z.string().min(1, "Title is required"),
  amount: z.coerce.number().min(0),
  category: z.string().min(1, "Category is required"),
  date: z.string(),
  paymentMethod: z.enum(["Cash", "Bank Transfer", "Card", "Cheque"]).optional(),
  status: z.enum(["pending", "paid", "overdue"]).optional(),
  description: z.string().optional(),
  remarks: z.string().optional(),
  published: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ZaadExpense = z.infer<typeof zaadExpenseSchema>;

export const createZaadExpenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.coerce.number().min(0, "Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  date: z.string(),
  paymentMethod: z.enum(["Cash", "Bank Transfer", "Card", "Cheque"]).optional(),
  status: z.enum(["pending", "paid", "overdue"]).optional(),
  description: z.string().optional(),
  remarks: z.string().optional(),
});
export type CreateZaadExpenseInput = z.infer<typeof createZaadExpenseSchema>;

export const updateZaadExpenseSchema = createZaadExpenseSchema.partial();
export type UpdateZaadExpenseInput = z.infer<typeof updateZaadExpenseSchema>;

// ==================== UPLOAD SCHEMAS ====================
export const uploadedFileSchema = z.object({
  publicId: z.string(),
  url: z.string(),
  filename: z.string(),
  size: z.number(),
  mimeType: z.string(),
});
export type UploadedFile = z.infer<typeof uploadedFileSchema>;

export const fileUploadSchema = z.object({
  file: z.instanceof(File).refine((file) => file.size <= 10 * 1024 * 1024, {
    message: "File size must be less than 10MB",
  }),
});
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
