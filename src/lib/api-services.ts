import { apiClient } from "./api-client";
import type {
  ICompany,
  IEmployee,
  IDocument,
  ITask,
  ILiability,
  IZaadExpense,
  IUser,
  IIndividual,
  IRecord,
  IInvoice,
  IUserActivity,
} from "@/types";

// ==================== AUTH SERVICES ====================

export const authService = {
  async login(email: string, password: string) {
    const response = await apiClient.post("/auth/login", { email, password });
    if (response.tokens?.accessToken) {
      apiClient.setAuthToken(response.tokens.accessToken);
    }
    return response;
  },

  async refreshToken(refreshToken: string) {
    const response = await apiClient.post("/auth/refresh", { refreshToken });
    if (response.tokens?.accessToken) {
      apiClient.setAuthToken(response.tokens.accessToken);
    }
    return response;
  },

  async logout(refreshToken: string) {
    return apiClient.post("/auth/logout", { refreshToken });
  },

  async getCurrentUser() {
    return apiClient.get<IUser>("/auth/me");
  },
};

// ==================== USER SERVICES ====================

export const userService = {
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    return apiClient.get<{ users: IUser[]; total: number; pages: number }>("/users", { params });
  },

  async getUser(id: string) {
    return apiClient.get<IUser>(`/users/${id}`);
  },

  async createUser(data: Omit<IUser, "_id" | "createdAt" | "updatedAt">) {
    return apiClient.post<IUser>("/users", data);
  },

  async updateUser(id: string, data: Partial<IUser>) {
    return apiClient.put<IUser>(`/users/${id}`, data);
  },

  async deleteUser(id: string) {
    return apiClient.delete(`/users/${id}`);
  },
};

// ==================== COMPANY SERVICES ====================

export const companyService = {
  async getCompanies(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    return apiClient.get<{ companies: ICompany[]; total: number; pages: number }>(
      "/companies",
      { params }
    );
  },

  async getCompany(id: string) {
    return apiClient.get<ICompany>(`/companies/${id}`);
  },

  async createCompany(data: Omit<ICompany, "_id" | "createdAt" | "updatedAt">) {
    return apiClient.post<ICompany>("/companies", data);
  },

  async updateCompany(id: string, data: Partial<ICompany>) {
    return apiClient.put<ICompany>(`/companies/${id}`, data);
  },

  async deleteCompany(id: string) {
    return apiClient.delete(`/companies/${id}`);
  },
};

// ==================== EMPLOYEE SERVICES ====================

export const employeeService = {
  async getEmployees(params?: {
    page?: number;
    limit?: number;
    search?: string;
    company?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    return apiClient.get<{ employees: IEmployee[]; total: number; pages: number }>(
      "/employees",
      { params }
    );
  },

  async getEmployee(id: string) {
    return apiClient.get<IEmployee>(`/employees/${id}`);
  },

  async createEmployee(data: Omit<IEmployee, "_id" | "createdAt" | "updatedAt">) {
    return apiClient.post<IEmployee>("/employees", data);
  },

  async updateEmployee(id: string, data: Partial<IEmployee>) {
    return apiClient.put<IEmployee>(`/employees/${id}`, data);
  },

  async deleteEmployee(id: string) {
    return apiClient.delete(`/employees/${id}`);
  },
};

// ==================== INDIVIDUAL SERVICES ====================

export const individualService = {
  async getIndividuals(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    return apiClient.get<{ individuals: IIndividual[]; total: number; pages: number }>(
      "/individuals",
      { params }
    );
  },

  async getIndividual(id: string) {
    return apiClient.get<IIndividual>(`/individuals/${id}`);
  },

  async createIndividual(data: Omit<IIndividual, "_id" | "createdAt" | "updatedAt">) {
    return apiClient.post<IIndividual>("/individuals", data);
  },

  async updateIndividual(id: string, data: Partial<IIndividual>) {
    return apiClient.put<IIndividual>(`/individuals/${id}`, data);
  },

  async deleteIndividual(id: string) {
    return apiClient.delete(`/individuals/${id}`);
  },
};

// ==================== DOCUMENT SERVICES ====================

export const documentService = {
  async getDocuments(params?: {
    page?: number;
    limit?: number;
    search?: string;
    owner?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    return apiClient.get<{ documents: IDocument[]; total: number; pages: number }>(
      "/documents",
      { params }
    );
  },

  async getDocument(id: string) {
    return apiClient.get<IDocument>(`/documents/${id}`);
  },

  async createDocument(data: Omit<IDocument, "_id" | "createdAt" | "updatedAt">) {
    return apiClient.post<IDocument>("/documents", data);
  },

  async updateDocument(id: string, data: Partial<IDocument>) {
    return apiClient.put<IDocument>(`/documents/${id}`, data);
  },

  async deleteDocument(id: string) {
    return apiClient.delete(`/documents/${id}`);
  },

  async getExpiringDocuments(params?: { days?: number }) {
    return apiClient.get<IDocument[]>("/documents/expiring", { params });
  },
};

// ==================== TASK SERVICES ====================

export const taskService = {
  async getTasks(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    return apiClient.get<{ tasks: ITask[]; total: number; pages: number }>("/tasks", {
      params,
    });
  },

  async getTask(id: string) {
    return apiClient.get<ITask>(`/tasks/${id}`);
  },

  async createTask(data: Omit<ITask, "_id" | "createdAt" | "updatedAt">) {
    return apiClient.post<ITask>("/tasks", data);
  },

  async updateTask(id: string, data: Partial<ITask>) {
    return apiClient.put<ITask>(`/tasks/${id}`, data);
  },

  async deleteTask(id: string) {
    return apiClient.delete(`/tasks/${id}`);
  },
};

// ==================== INVOICE SERVICES ====================

export const invoiceService = {
  async getInvoices(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    company?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    return apiClient.get<{ invoices: IInvoice[]; total: number; pages: number }>(
      "/invoices",
      { params }
    );
  },

  async getInvoice(id: string) {
    return apiClient.get<IInvoice>(`/invoices/${id}`);
  },

  async createInvoice(data: Omit<IInvoice, "_id" | "createdAt" | "updatedAt">) {
    return apiClient.post<IInvoice>("/invoices", data);
  },

  async updateInvoice(id: string, data: Partial<IInvoice>) {
    return apiClient.put<IInvoice>(`/invoices/${id}`, data);
  },

  async deleteInvoice(id: string) {
    return apiClient.delete(`/invoices/${id}`);
  },

  async getOverdueInvoices(params?: { days?: number }) {
    return apiClient.get<IInvoice[]>("/invoices/overdue", { params });
  },
};

// ==================== LIABILITY SERVICES ====================

export const liabilityService = {
  async getLiabilities(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    return apiClient.get<{ liabilities: ILiability[]; total: number; pages: number }>(
      "/liabilities",
      { params }
    );
  },

  async getLiability(id: string) {
    return apiClient.get<ILiability>(`/liabilities/${id}`);
  },

  async createLiability(data: Omit<ILiability, "_id" | "createdAt" | "updatedAt">) {
    return apiClient.post<ILiability>("/liabilities", data);
  },

  async updateLiability(id: string, data: Partial<ILiability>) {
    return apiClient.put<ILiability>(`/liabilities/${id}`, data);
  },

  async deleteLiability(id: string) {
    return apiClient.delete(`/liabilities/${id}`);
  },
};

// ==================== RECORD SERVICES ====================

export const recordService = {
  async getRecords(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    return apiClient.get<{ records: IRecord[]; total: number; pages: number }>(
      "/records",
      { params }
    );
  },

  async getRecord(id: string) {
    return apiClient.get<IRecord>(`/records/${id}`);
  },

  async createRecord(data: Omit<IRecord, "_id" | "createdAt" | "updatedAt">) {
    return apiClient.post<IRecord>("/records", data);
  },

  async updateRecord(id: string, data: Partial<IRecord>) {
    return apiClient.put<IRecord>(`/records/${id}`, data);
  },

  async deleteRecord(id: string) {
    return apiClient.delete(`/records/${id}`);
  },
};

// ==================== ZAAD EXPENSE SERVICES ====================

export const zaadExpenseService = {
  async getExpenses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    return apiClient.get<{ expenses: IZaadExpense[]; total: number; pages: number }>(
      "/zaad-expenses",
      { params }
    );
  },

  async getExpense(id: string) {
    return apiClient.get<IZaadExpense>(`/zaad-expenses/${id}`);
  },

  async createExpense(data: Omit<IZaadExpense, "_id" | "createdAt" | "updatedAt">) {
    return apiClient.post<IZaadExpense>("/zaad-expenses", data);
  },

  async updateExpense(id: string, data: Partial<IZaadExpense>) {
    return apiClient.put<IZaadExpense>(`/zaad-expenses/${id}`, data);
  },

  async deleteExpense(id: string) {
    return apiClient.delete(`/zaad-expenses/${id}`);
  },
};

// ==================== UPLOAD SERVICES ====================

export interface UploadedFileData {
  publicId: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export const uploadService = {
  async uploadSingleFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<UploadedFileData>("/uploads/single", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async uploadMultipleFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    return apiClient.post<UploadedFileData[]>("/uploads/multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async deleteFile(publicId: string) {
    return apiClient.delete(`/uploads/${publicId}`);
  },

  async getFileMetadata(publicId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiClient.get<any>(`/uploads/${publicId}/metadata`);
  },
};

// ==================== ACTIVITY SERVICES ====================

export const activityService = {
  async getActivities(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    return apiClient.get<{ activities: IUserActivity[]; total: number; pages: number }>(
      "/activities",
      { params }
    );
  },

  async getActivity(id: string) {
    return apiClient.get<IUserActivity>(`/activities/${id}`);
  },
};
