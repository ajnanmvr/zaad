export type OwnerType = "company" | "employee" | "individual";

// Common fields for almost all entities
interface BaseEntity {
  _id: string;
  published: boolean;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export interface ICompany extends BaseEntity {
  name: string;
  licenseNo?: string;
  companyType?: string;
  emirates?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  transactionNo?: string;
  isMainland?: "mainland" | "freezone" | "";
  remarks?: string;
}

export interface IEmployee extends BaseEntity {
  name: string;
  company?: string; // ObjectId Reference
  isActive: boolean;
  emiratesId?: string;
  nationality?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  designation?: string;
  remarks?: string;
}

export interface IIndividual extends BaseEntity {
  name: string;
  nationality?: string;
  passportNo?: string;
  phone?: string;
  email?: string;
  remarks?: string;
}

export interface ITask extends BaseEntity {
  title: string;
  description?: string;
  assignedTo?: string; // ObjectId Reference
  createdBy: string; // ObjectId Reference
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: string; // ISO Date string
}

export interface IDocument extends BaseEntity {
  company?: string; // ObjectId Reference
  employee?: string; // ObjectId Reference
  individual?: string; // ObjectId Reference
  name: string;
  type: string;
  expiryDate?: string; // ISO Date string
  file?: string; // File path/URL
  remarks?: string;
  // Computed fields (optional, for UI)
  daysUntil?: number;
  status?: "expired" | "expiring" | "valid";
}

export interface IInvoice extends BaseEntity {
  invoiceNo: number; // Changed to number
  title?: string;
  suffix?: string;
  client?: string;
  company?: string; // ObjectId Reference
  individual?: string; // ObjectId Reference
  location?: string;
  trn?: string;
  purpose?: string;
  advance?: number;
  showBalance?: string;
  amount: number;
  tax?: number;
  status: "draft" | "sent" | "paid" | "overdue";
  date: string; // ISO Date string
  validTo?: string;
  quotation?: boolean;
  message?: string;
  remarks?: string;
  createdBy?: string;
  items?: IInvoiceItem[];
}

export interface IInvoiceItem {
  title?: string;
  desc?: string;
  rate?: number;
  quantity?: number;
}

export interface IRecord extends BaseEntity {
  company?: string; // ObjectId Reference
  individual?: string; // ObjectId Reference
  employee?: string; // ObjectId Reference
  type: "income" | "expense";
  amount: number;
  particular: string;
  category?: string;
  method?: "bank" | "cash" | "tasdeed" | "swiper" | "service fee" | "liability";
  date: string; // ISO Date string
  status?: "cleared" | "pending" | "rejected";
  remarks?: string;
  invoiceNo?: string | number; // Allow both for flexibility
  suffix?: string;
  number?: number;
  serviceFee?: number;
  self?: string;
  edited?: boolean;
  createdBy?: string;
}

export interface ILiability extends BaseEntity {
  company?: string; // ID
  individual?: string; // ID
  type: "payable" | "receivable" | "loan" | "credit" | "debit" | "other";
  amount: number;
  paidAmount?: number;
  description: string;
  status: "pending" | "partial" | "paid" | "active" | "closed" | "overdue";
  dueDate?: string; // ISO Date string
  remarks?: string;
}

export interface IZaadExpense extends BaseEntity {
  title: string;
  amount: number;
  category: string;
  date: string; // ISO Date string
  description?: string;
  paymentMethod: "Cash" | "Bank Transfer" | "Card" | "Cheque";
  status: "pending" | "paid" | "overdue";
  remarks?: string;
}

export interface IUser extends BaseEntity {
  name: string;
  email: string;
  username?: string;
  role: "admin" | "user" | "partner" | "employee";
  status?: "active" | "inactive" | "suspended";
  lastLogin?: string;
}

export interface ICredential {
  platform: string;
  username: string;
  password?: string;
}

export interface IUserActivity extends BaseEntity {
  targetUser?: string;
  performedBy?: string;
  action: string;
  details?: string;
}

export interface IDayCounts {
  expired?: number;
  expiring?: number;
}

export interface ICalendarDocument {
  company: string;
  type: string;
  expiresOn: string;
}

export interface ICalendarTask {
  id: string;
  title: string;
  status: "pending" | "in-progress" | "completed";
}

export interface ICalendarEvents {
  events: Record<string, IDayCounts>;
  documents: Record<string, ICalendarDocument[]>;
  tasks: Record<string, ICalendarTask[]>;
}

export interface IStoredPassword {
  platform: string;
  username: string;
  password?: string;
}

export interface IEmbeddedDocument {
  name: string;
  issueDate?: string;
  expiryDate?: string;
  attachment?: string;
}
