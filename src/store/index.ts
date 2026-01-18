import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
import {
  companyService,
  employeeService,
  documentService,
  taskService,
  invoiceService,
  liabilityService,
  userService,
  individualService,
  recordService,
  zaadExpenseService,
  activityService,
} from "@/lib/api-services";

type Theme = "dark" | "light" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

interface AppState {
  // Data
  companies: ICompany[];
  employees: IEmployee[];
  individuals: IIndividual[];
  documents: IDocument[];
  invoices: IInvoice[];
  records: IRecord[];
  tasks: ITask[];
  liabilities: ILiability[];
  zaadExpenses: IZaadExpense[];
  users: IUser[];
  userActivities: IUserActivity[];

  // Loading states
  loading: boolean;
  error: string | null;

  // Company methods
  fetchCompanies: () => Promise<void>;
  addCompany: (company: Omit<ICompany, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateCompany: (id: string, data: Partial<ICompany>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;

  // Employee methods
  fetchEmployees: () => Promise<void>;
  addEmployee: (employee: Omit<IEmployee, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateEmployee: (id: string, data: Partial<IEmployee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  // Document methods
  fetchDocuments: () => Promise<void>;
  addDocument: (doc: Omit<IDocument, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateDocument: (id: string, data: Partial<IDocument>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  // Task methods
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<ITask, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateTask: (id: string, data: Partial<ITask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Invoice methods
  fetchInvoices: () => Promise<void>;
  addInvoice: (invoice: Omit<IInvoice, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateInvoice: (id: string, data: Partial<IInvoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  // Liability methods
  fetchLiabilities: () => Promise<void>;
  addLiability: (liability: Omit<ILiability, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateLiability: (id: string, data: Partial<ILiability>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;

  // User methods
  fetchUsers: () => Promise<void>;
  addUser: (user: Omit<IUser, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateUser: (id: string, data: Partial<IUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Individual methods
  fetchIndividuals: () => Promise<void>;
  addIndividual: (individual: Omit<IIndividual, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateIndividual: (id: string, data: Partial<IIndividual>) => Promise<void>;
  deleteIndividual: (id: string) => Promise<void>;

  // Record methods
  fetchRecords: () => Promise<void>;
  addRecord: (record: Omit<IRecord, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateRecord: (id: string, data: Partial<IRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;

  // Zaad Expense methods
  fetchZaadExpenses: () => Promise<void>;
  addZaadExpense: (expense: Omit<IZaadExpense, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateZaadExpense: (id: string, data: Partial<IZaadExpense>) => Promise<void>;
  deleteZaadExpense: (id: string) => Promise<void>;

  // Activity methods
  fetchActivities: () => Promise<void>;
  addUserActivity: (activity: Omit<IUserActivity, "_id" | "createdAt" | "updatedAt">) => void;
}

const storeCreator = (set: any) => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return {
    companies: [],
    employees: [],
    individuals: [],
    documents: [],
    invoices: [],
    records: [],
    tasks: [],
    liabilities: [],
    zaadExpenses: [],
    users: [],
    userActivities: [],
    loading: false,
    error: null as string | null,

    // ==================== COMPANIES ====================
    fetchCompanies: async () => {
      set({ loading: true });
      try {
        const result = await companyService.getCompanies({ limit: 100 });
        set({ 
          companies: result.companies || [], 
          loading: false,
          error: null
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch companies";
        set({ loading: false, error: errorMessage });
      }
    },
    addCompany: async (data: Omit<ICompany, "_id" | "createdAt" | "updatedAt">) => {
      set({ loading: true });
      try {
        const newCompany = await companyService.createCompany({ ...data, published: false });
        set((state: { companies: any[] }) => ({
          companies: [...state.companies, newCompany],
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create company";
        set({ loading: false, error: errorMessage });
      }
    },
    updateCompany: async (id: string, data: Partial<ICompany>) => {
      set({ loading: true });
      try {
        const updated = await companyService.updateCompany(id, data);
        set((state: { companies: any[] }) => ({
          companies: state.companies.map((item: any) =>
            item._id === id ? { ...item, ...updated } : item
          ),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update company";
        set({ loading: false, error: errorMessage });
      }
    },
    deleteCompany: async (id: string) => {
      set({ loading: true });
      try {
        await companyService.deleteCompany(id);
        set((state: { companies: any[] }) => ({
          companies: state.companies.filter((item: any) => item._id !== id),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete company";
        set({ loading: false, error: errorMessage });
      }
    },

    // ==================== EMPLOYEES ====================
    fetchEmployees: async () => {
      set({ loading: true });
      try {
        const result = await employeeService.getEmployees({ limit: 100 });
        set({ 
          employees: result.employees || [], 
          loading: false,
          error: null
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch employees";
        set({ loading: false, error: errorMessage });
      }
    },
    addEmployee: async (data: Omit<IEmployee, "_id" | "createdAt" | "updatedAt">) => {
      set({ loading: true });
      try {
        const newEmployee = await employeeService.createEmployee({ ...data, published: false });
        set((state: { employees: any[] }) => ({
          employees: [...state.employees, newEmployee],
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create employee";
        set({ loading: false, error: errorMessage });
      }
    },
    updateEmployee: async (id: string, data: Partial<IEmployee>) => {
      set({ loading: true });
      try {
        const updated = await employeeService.updateEmployee(id, data);
        set((state: { employees: any[] }) => ({
          employees: state.employees.map((item: any) =>
            item._id === id ? { ...item, ...updated } : item
          ),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update employee";
        set({ loading: false, error: errorMessage });
      }
    },
    deleteEmployee: async (id: string) => {
      set({ loading: true });
      try {
        await employeeService.deleteEmployee(id);
        set((state: { employees: any[] }) => ({
          employees: state.employees.filter((item: any) => item._id !== id),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete employee";
        set({ loading: false, error: errorMessage });
      }
    },

    // ==================== DOCUMENTS ====================
    fetchDocuments: async () => {
      set({ loading: true });
      try {
        const result = await documentService.getDocuments({ limit: 100 });
        set({ 
          documents: result.documents || [], 
          loading: false,
          error: null
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch documents";
        set({ loading: false, error: errorMessage });
      }
    },
    addDocument: async (data: Omit<IDocument, "_id" | "createdAt" | "updatedAt">) => {
      set({ loading: true });
      try {
        const newDocument = await documentService.createDocument({ ...data, published: false });
        set((state: { documents: any[] }) => ({
          documents: [...state.documents, newDocument],
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create document";
        set({ loading: false, error: errorMessage });
      }
    },
    updateDocument: async (id: string, data: Partial<IDocument>) => {
      set({ loading: true });
      try {
        const updated = await documentService.updateDocument(id, data);
        set((state: { documents: any[] }) => ({
          documents: state.documents.map((item: any) =>
            item._id === id ? { ...item, ...updated } : item
          ),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update document";
        set({ loading: false, error: errorMessage });
      }
    },
    deleteDocument: async (id: string) => {
      set({ loading: true });
      try {
        await documentService.deleteDocument(id);
        set((state: { documents: any[] }) => ({
          documents: state.documents.filter((item: any) => item._id !== id),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete document";
        set({ loading: false, error: errorMessage });
      }
    },

    // ==================== TASKS ====================
    fetchTasks: async () => {
      set({ loading: true });
      try {
        const result = await taskService.getTasks({ limit: 100 });
        set({ 
          tasks: result.tasks || [], 
          loading: false,
          error: null
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch tasks";
        set({ loading: false, error: errorMessage });
      }
    },
    addTask: async (data: Omit<ITask, "_id" | "createdAt" | "updatedAt">) => {
      set({ loading: true });
      try {
        const newTask = await taskService.createTask({ ...data, published: false });
        set((state: { tasks: any[] }) => ({
          tasks: [...state.tasks, newTask],
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create task";
        set({ loading: false, error: errorMessage });
      }
    },
    updateTask: async (id: string, data: Partial<ITask>) => {
      set({ loading: true });
      try {
        const updated = await taskService.updateTask(id, data);
        set((state: { tasks: any[] }) => ({
          tasks: state.tasks.map((item: any) =>
            item._id === id ? { ...item, ...updated } : item
          ),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update task";
        set({ loading: false, error: errorMessage });
      }
    },
    deleteTask: async (id: string) => {
      set({ loading: true });
      try {
        await taskService.deleteTask(id);
        set((state: { tasks: any[] }) => ({
          tasks: state.tasks.filter((item: any) => item._id !== id),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete task";
        set({ loading: false, error: errorMessage });
      }
    },

    // ==================== INVOICES ====================
    fetchInvoices: async () => {
      set({ loading: true });
      try {
        const result = await invoiceService.getInvoices({ limit: 100 });
        set({ 
          invoices: result.invoices || [], 
          loading: false,
          error: null
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch invoices";
        set({ loading: false, error: errorMessage });
      }
    },
    addInvoice: async (data: Omit<IInvoice, "_id" | "createdAt" | "updatedAt">) => {
      set({ loading: true });
      try {
        const newInvoice = await invoiceService.createInvoice({ ...data, published: false });
        set((state: { invoices: any[] }) => ({
          invoices: [...state.invoices, newInvoice],
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create invoice";
        set({ loading: false, error: errorMessage });
      }
    },
    updateInvoice: async (id: string, data: Partial<IInvoice>) => {
      set({ loading: true });
      try {
        const updated = await invoiceService.updateInvoice(id, data);
        set((state: { invoices: any[] }) => ({
          invoices: state.invoices.map((item: any) =>
            item._id === id ? { ...item, ...updated } : item
          ),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update invoice";
        set({ loading: false, error: errorMessage });
      }
    },
    deleteInvoice: async (id: string) => {
      set({ loading: true });
      try {
        await invoiceService.deleteInvoice(id);
        set((state: { invoices: any[] }) => ({
          invoices: state.invoices.filter((item: any) => item._id !== id),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete invoice";
        set({ loading: false, error: errorMessage });
      }
    },

    // ==================== LIABILITIES ====================
    fetchLiabilities: async () => {
      set({ loading: true });
      try {
        const result = await liabilityService.getLiabilities({ limit: 100 });
        set({ 
          liabilities: result.liabilities || [], 
          loading: false,
          error: null
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch liabilities";
        set({ loading: false, error: errorMessage });
      }
    },
    addLiability: async (data: Omit<ILiability, "_id" | "createdAt" | "updatedAt">) => {
      set({ loading: true });
      try {
        const newLiability = await liabilityService.createLiability({ ...data, published: false });
        set((state: { liabilities: any[] }) => ({
          liabilities: [...state.liabilities, newLiability],
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create liability";
        set({ loading: false, error: errorMessage });
      }
    },
    updateLiability: async (id: string, data: Partial<ILiability>) => {
      set({ loading: true });
      try {
        const updated = await liabilityService.updateLiability(id, data);
        set((state: { liabilities: any[] }) => ({
          liabilities: state.liabilities.map((item: any) =>
            item._id === id ? { ...item, ...updated } : item
          ),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update liability";
        set({ loading: false, error: errorMessage });
      }
    },
    deleteLiability: async (id: string) => {
      set({ loading: true });
      try {
        await liabilityService.deleteLiability(id);
        set((state: { liabilities: any[] }) => ({
          liabilities: state.liabilities.filter((item: any) => item._id !== id),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete liability";
        set({ loading: false, error: errorMessage });
      }
    },

    // ==================== USERS ====================
    fetchUsers: async () => {
      set({ loading: true });
      try {
        const result = await userService.getUsers({ limit: 100 });
        set({ 
          users: result.users || [], 
          loading: false,
          error: null
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch users";
        set({ loading: false, error: errorMessage });
      }
    },
    addUser: async (data: Omit<IUser, "_id" | "createdAt" | "updatedAt">) => {
      set({ loading: true });
      try {
        const newUser = await userService.createUser({ ...data, published: false });
        set((state: { users: any[] }) => ({
          users: [...state.users, newUser],
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create user";
        set({ loading: false, error: errorMessage });
      }
    },
    updateUser: async (id: string, data: Partial<IUser>) => {
      set({ loading: true });
      try {
        const updated = await userService.updateUser(id, data);
        set((state: { users: any[] }) => ({
          users: state.users.map((item: any) =>
            item._id === id ? { ...item, ...updated } : item
          ),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update user";
        set({ loading: false, error: errorMessage });
      }
    },
    deleteUser: async (id: string) => {
      set({ loading: true });
      try {
        await userService.deleteUser(id);
        set((state: { users: any[] }) => ({
          users: state.users.filter((item: any) => item._id !== id),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
        set({ loading: false, error: errorMessage });
      }
    },

    // ==================== INDIVIDUALS ====================
    fetchIndividuals: async () => {
      set({ loading: true });
      try {
        const result = await individualService.getIndividuals({ limit: 100 });
        set({ 
          individuals: result.individuals || [], 
          loading: false,
          error: null
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch individuals";
        set({ loading: false, error: errorMessage });
      }
    },
    addIndividual: async (data: Omit<IIndividual, "_id" | "createdAt" | "updatedAt">) => {
      set({ loading: true });
      try {
        const newIndividual = await individualService.createIndividual({ ...data, published: false });
        set((state: { individuals: any[] }) => ({
          individuals: [...state.individuals, newIndividual],
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create individual";
        set({ loading: false, error: errorMessage });
      }
    },
    updateIndividual: async (id: string, data: Partial<IIndividual>) => {
      set({ loading: true });
      try {
        const updated = await individualService.updateIndividual(id, data);
        set((state: { individuals: any[] }) => ({
          individuals: state.individuals.map((item: any) =>
            item._id === id ? { ...item, ...updated } : item
          ),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update individual";
        set({ loading: false, error: errorMessage });
      }
    },
    deleteIndividual: async (id: string) => {
      set({ loading: true });
      try {
        await individualService.deleteIndividual(id);
        set((state: { individuals: any[] }) => ({
          individuals: state.individuals.filter((item: any) => item._id !== id),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete individual";
        set({ loading: false, error: errorMessage });
      }
    },

    // ==================== RECORDS ====================
    fetchRecords: async () => {
      set({ loading: true });
      try {
        const result = await recordService.getRecords({ limit: 100 });
        set({ 
          records: result.records || [], 
          loading: false,
          error: null
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch records";
        set({ loading: false, error: errorMessage });
      }
    },
    addRecord: async (data: Omit<IRecord, "_id" | "createdAt" | "updatedAt">) => {
      set({ loading: true });
      try {
        const newRecord = await recordService.createRecord({ ...data, published: false });
        set((state: { records: any[] }) => ({
          records: [...state.records, newRecord],
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create record";
        set({ loading: false, error: errorMessage });
      }
    },
    updateRecord: async (id: string, data: Partial<IRecord>) => {
      set({ loading: true });
      try {
        const updated = await recordService.updateRecord(id, data);
        set((state: { records: any[] }) => ({
          records: state.records.map((item: any) =>
            item._id === id ? { ...item, ...updated } : item
          ),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update record";
        set({ loading: false, error: errorMessage });
      }
    },
    deleteRecord: async (id: string) => {
      set({ loading: true });
      try {
        await recordService.deleteRecord(id);
        set((state: { records: any[] }) => ({
          records: state.records.filter((item: any) => item._id !== id),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete record";
        set({ loading: false, error: errorMessage });
      }
    },

    // ==================== ZAAD EXPENSES ====================
    fetchZaadExpenses: async () => {
      set({ loading: true });
      try {
        const result = await zaadExpenseService.getExpenses({ limit: 100 });
        set({ 
          zaadExpenses: result.expenses || [], 
          loading: false,
          error: null
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch expenses";
        set({ loading: false, error: errorMessage });
      }
    },
    addZaadExpense: async (data: Omit<IZaadExpense, "_id" | "createdAt" | "updatedAt">) => {
      set({ loading: true });
      try {
        const newExpense = await zaadExpenseService.createExpense({ ...data, published: false });
        set((state: { zaadExpenses: any[] }) => ({
          zaadExpenses: [...state.zaadExpenses, newExpense],
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create expense";
        set({ loading: false, error: errorMessage });
      }
    },
    updateZaadExpense: async (id: string, data: Partial<IZaadExpense>) => {
      set({ loading: true });
      try {
        const updated = await zaadExpenseService.updateExpense(id, data);
        set((state: { zaadExpenses: any[] }) => ({
          zaadExpenses: state.zaadExpenses.map((item: any) =>
            item._id === id ? { ...item, ...updated } : item
          ),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update expense";
        set({ loading: false, error: errorMessage });
      }
    },
    deleteZaadExpense: async (id: string) => {
      set({ loading: true });
      try {
        await zaadExpenseService.deleteExpense(id);
        set((state: { zaadExpenses: any[] }) => ({
          zaadExpenses: state.zaadExpenses.filter((item: any) => item._id !== id),
          loading: false,
          error: null
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete expense";
        set({ loading: false, error: errorMessage });
      }
    },

    // ==================== ACTIVITIES ====================
    fetchActivities: async () => {
      set({ loading: true });
      try {
        const result = await activityService.getActivities({ limit: 100 });
        set({ 
          userActivities: result.activities || [], 
          loading: false,
          error: null
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch activities";
        set({ loading: false, error: errorMessage });
      }
    },
    addUserActivity: (data: Omit<IUserActivity, "_id" | "createdAt" | "updatedAt">) =>
      set((state: { userActivities: any[] }) => ({
        userActivities: [
          ...state.userActivities,
          {
            ...data,
            _id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      })),
    /* eslint-enable @typescript-eslint/no-explicit-any */
  };
};

export const useStore = create<AppState>()(
  persist(
    storeCreator as any,
    {
      name: "zaad-store-v2",
      storage: createJSONStorage(() => localStorage),
    }
  )
) as any;

// Theme Store
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme: Theme) => {
        set({ theme });
        applyTheme(theme);
      },
      initTheme: () => {
        const storedTheme = localStorage.getItem("zaad-theme-storage");
        if (storedTheme) {
          try {
            const parsed = JSON.parse(storedTheme);
            applyTheme(parsed.state?.theme || "system");
          } catch {
            applyTheme("system");
          }
        } else {
          applyTheme("system");
        }
      },
    }),
    {
      name: "zaad-theme-storage",
    }
  )
);

function applyTheme(theme: Theme) {
  const root = window.document.documentElement;

  root.classList.remove("light", "dark");

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

    root.classList.add(systemTheme);
    return;
  }

  root.classList.add(theme);
}
