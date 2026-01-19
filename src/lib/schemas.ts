import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(2, "Name is required"),
  licenseNo: z.string().optional(),
  companyType: z.string().optional(),
  emirates: z.string().optional(),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  email: z.email("Invalid email").optional().or(z.literal("")),
  isMainland: z.enum(["mainland", "freezone", ""]).optional(),
  remarks: z.string().optional(),
  transactionNo: z.string().optional(),
  passwords: z
    .array(
      z.object({
        platform: z.string(),
        username: z.string(),
        password: z.string().optional(),
      })
    )
    .optional(),
  documents: z
    .array(
      z.object({
        name: z.string(),
        issueDate: z.string().optional(),
        expiryDate: z.string().optional(),
        attachment: z.string().optional(),
      })
    )
    .optional(),
});

export const employeeSchema = z.object({
  name: z.string().min(2, "Name is required"),
  company: z.string().optional(),
  isActive: z.boolean().default(true),
  emiratesId: z.string().optional(),
  nationality: z.string().optional(),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  designation: z.string().optional(),
  remarks: z.string().optional(),
  passwords: z
    .array(
      z.object({
        platform: z.string(),
        username: z.string(),
        password: z.string().optional(),
      })
    )
    .optional(),
  documents: z
    .array(
      z.object({
        name: z.string(),
        expiryDate: z.string().optional(),
      })
    )
    .optional(),
});

export const individualSchema = z.object({
  name: z.string().min(2, "Name is required"),
  nationality: z.string().optional(),
  passportNo: z.string().optional(),
  phone: z.string().optional(),
  email: z.email("Invalid email").optional().or(z.literal("")),
  remarks: z.string().optional(),
});

export const taskSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
});

export const invoiceSchema = z.object({
  invoiceNo: z.number().min(1, "Invoice number is required"),
  company: z.string().optional(),
  individual: z.string().optional(),
  client: z.string().optional(),
  amount: z.coerce.number().min(0),
  tax: z.coerce.number().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue"]),
  date: z.string(),
  validTo: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  trn: z.string().optional(),
  remarks: z.string().optional(),
  items: z
    .array(
      z.object({
        title: z.string().optional(),
        desc: z.string().optional(),
        rate: z.coerce.number().optional(),
        quantity: z.coerce.number().optional(),
      })
    )
    .optional(),
});

export const recordSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().min(1, "Amount is required"),
  particular: z.string().min(2, "Particular is required"),
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

export const liabilitySchema = z.object({
  type: z.enum(["payable", "receivable", "loan", "credit", "debit", "other"]),
  amount: z.coerce.number().min(1, "Amount is required"),
  description: z.string().min(2, "Description is required"),
  status: z.enum(["pending", "partial", "paid", "active", "closed", "overdue"]),
  dueDate: z.string().optional(), // Converted to Date object in store if needed, but keeping as string for form usually easier
  company: z.string().optional(),
  individual: z.string().optional(),
  remarks: z.string().optional(),
  paidAmount: z.coerce.number().optional(),
});

export const expenseSchema = z.object({
  title: z.string().min(2, "Title is required"),
  amount: z.coerce.number().min(1, "Amount is required"),
  category: z.string().min(2, "Category is required"),
  date: z.string(),
  paymentMethod: z.enum(["Cash", "Bank Transfer", "Card", "Cheque"]),
  status: z.enum(["pending", "paid", "overdue"]),
  description: z.string().optional(),
  remarks: z.string().optional(),
});

export const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["admin", "user", "partner", "employee"]),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  username: z.string().optional(),
});
