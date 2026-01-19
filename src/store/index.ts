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
  ICredential,
} from "@/types";
import {
  generateCompanies,
  generateEmployees,
  generateDocuments,
  generateTasks,
  generateLiabilities,
  generateExpenses,
  generateUsers,
  generateIndividuals,
  generateRecords,
  generateInvoices,
  generateUserActivities,
  generateId,
} from "@/lib/mock-data";

type Theme = "dark" | "light" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

interface AppState {
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
  credentials: ICredential[];
  userActivities: IUserActivity[];

  addCompany: (
    company: Omit<ICompany, "_id" | "createdAt" | "updatedAt">
  ) => void;
  updateCompany: (id: string, data: Partial<ICompany>) => void;
  deleteCompany: (id: string) => void;

  addEmployee: (
    employee: Omit<IEmployee, "_id" | "createdAt" | "updatedAt">
  ) => void;
  updateEmployee: (id: string, data: Partial<IEmployee>) => void;
  deleteEmployee: (id: string) => void;

  addDocument: (
    doc: Omit<IDocument, "_id" | "createdAt" | "updatedAt">
  ) => void;
  updateDocument: (id: string, data: Partial<IDocument>) => void;
  deleteDocument: (id: string) => void;

  addTask: (task: Omit<ITask, "_id" | "createdAt" | "updatedAt">) => void;
  updateTask: (id: string, data: Partial<ITask>) => void;
  deleteTask: (id: string) => void;

  addZaadExpense: (
    expense: Omit<IZaadExpense, "_id" | "createdAt" | "updatedAt">
  ) => void;
  updateZaadExpense: (id: string, data: Partial<IZaadExpense>) => void;
  deleteZaadExpense: (id: string) => void;

  addLiability: (
    liability: Omit<ILiability, "_id" | "createdAt" | "updatedAt">
  ) => void;
  updateLiability: (id: string, data: Partial<ILiability>) => void;
  deleteLiability: (id: string) => void;

  addUser: (user: Omit<IUser, "_id" | "createdAt" | "updatedAt">) => void;
  updateUser: (id: string, data: Partial<IUser>) => void;
  deleteUser: (id: string) => void;

  addIndividual: (
    individual: Omit<IIndividual, "_id" | "createdAt" | "updatedAt">
  ) => void;
  updateIndividual: (id: string, data: Partial<IIndividual>) => void;
  deleteIndividual: (id: string) => void;

  addInvoice: (
    invoice: Omit<IInvoice, "_id" | "createdAt" | "updatedAt">
  ) => void;
  updateInvoice: (id: string, data: Partial<IInvoice>) => void;
  deleteInvoice: (id: string) => void;

  addRecord: (record: Omit<IRecord, "_id" | "createdAt" | "updatedAt">) => void;
  updateRecord: (id: string, data: Partial<IRecord>) => void;
  deleteRecord: (id: string) => void;

  addUserActivity: (
    activity: Omit<IUserActivity, "_id" | "createdAt" | "updatedAt">
  ) => void;
}

// @ts-ignore - Zustand store configuration with dynamic any types
export const useStore = create<AppState>()(
  persist(
    (set: any) => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return {
        companies: generateCompanies(),
      employees: generateEmployees(),
      individuals: generateIndividuals(),
      documents: generateDocuments(),
      invoices: generateInvoices(),
      records: generateRecords(),
      tasks: generateTasks(),
      liabilities: generateLiabilities(),
      zaadExpenses: generateExpenses(),
      users: generateUsers(),
      credentials: [] as ICredential[],
      userActivities: generateUserActivities(),

      addCompany: (data: Omit<ICompany, "_id" | "createdAt" | "updatedAt">) =>
        set((state: { companies: any; }) => ({
          companies: [
            ...state.companies,
            {
              ...data,
              _id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateCompany: (id: string, data: Partial<ICompany>) =>
        set((state: { companies: any[]; }) => ({
          companies: state.companies.map((i: { _id: string; }) =>
            i._id === id
              ? { ...i, ...data, updatedAt: new Date().toISOString() }
              : i
          ),
        })),
      deleteCompany: (id: string) =>
        set((state: { companies: any[]; }) => ({
          companies: state.companies.filter((i: { _id: string; }) => i._id !== id),
        })),

      addEmployee: (data: Omit<IEmployee, "_id" | "createdAt" | "updatedAt">) =>
        set((state: { employees: any; }) => ({
          employees: [
            ...state.employees,
            {
              ...data,
              _id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateEmployee: (id: string, data: Partial<IEmployee>) =>
        set((state: { employees: any[]; }) => ({
          employees: state.employees.map((i: { _id: string; }) =>
            i._id === id
              ? { ...i, ...data, updatedAt: new Date().toISOString() }
              : i
          ),
        })),
      deleteEmployee: (id: string) =>
        set((state: { employees: any[]; }) => ({
          employees: state.employees.filter((i: { _id: string; }) => i._id !== id),
        })),

      addDocument: (data: Omit<IDocument, "_id" | "createdAt" | "updatedAt">) =>
        set((state: { documents: any; }) => ({
          documents: [
            ...state.documents,
            {
              ...data,
              _id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateDocument: (id: string, data: Partial<IDocument>) =>
        set((state: { documents: any[]; }) => ({
          documents: state.documents.map((i: { _id: string; }) =>
            i._id === id
              ? { ...i, ...data, updatedAt: new Date().toISOString() }
              : i
          ),
        })),
      deleteDocument: (id: string) =>
        set((state: { documents: any[]; }) => ({
          documents: state.documents.filter((i: { _id: string; }) => i._id !== id),
        })),

      addTask: (data: Omit<ITask, "_id" | "createdAt" | "updatedAt">) =>
        set((state: { tasks: any; }) => ({
          tasks: [
            ...state.tasks,
            {
              ...data,
              _id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateTask: (id: string, data: Partial<ITask>) =>
        set((state: { tasks: any[]; }) => ({
          tasks: state.tasks.map((i: { _id: string; }) =>
            i._id === id
              ? { ...i, ...data, updatedAt: new Date().toISOString() }
              : i
          ),
        })),
      deleteTask: (id: string) =>
        set((state: { tasks: any[]; }) => ({ tasks: state.tasks.filter((i: { _id: string; }) => i._id !== id) })),

      addZaadExpense: (
        data: Omit<IZaadExpense, "_id" | "createdAt" | "updatedAt">
      ) =>
        set((state: { zaadExpenses: any; }) => ({
          zaadExpenses: [
            ...state.zaadExpenses,
            {
              ...data,
              _id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateZaadExpense: (id: string, data: Partial<IZaadExpense>) =>
        set((state: { zaadExpenses: any[]; }) => ({
          zaadExpenses: state.zaadExpenses.map((i: { _id: string; }) =>
            i._id === id
              ? { ...i, ...data, updatedAt: new Date().toISOString() }
              : i
          ),
        })),
      deleteZaadExpense: (id: string) =>
        set((state: { zaadExpenses: any[]; }) => ({
          zaadExpenses: state.zaadExpenses.filter((i: { _id: string; }) => i._id !== id),
        })),

      addLiability: (
        data: Omit<ILiability, "_id" | "createdAt" | "updatedAt">
      ) =>
        set((state: { liabilities: any; }) => ({
          liabilities: [
            ...state.liabilities,
            {
              ...data,
              _id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateLiability: (id: string, data: Partial<ILiability>) =>
        set((state: { liabilities: any[]; }) => ({
          liabilities: state.liabilities.map((i: { _id: string; }) =>
            i._id === id
              ? { ...i, ...data, updatedAt: new Date().toISOString() }
              : i
          ),
        })),
      deleteLiability: (id: string) =>
        set((state: { liabilities: any[]; }) => ({
          liabilities: state.liabilities.filter((i: { _id: string; }) => i._id !== id),
        })),

      addUser: (data: Omit<IUser, "_id" | "createdAt" | "updatedAt">) =>
        set((state: { users: any; }) => ({
          users: [
            ...state.users,
            {
              ...data,
              _id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateUser: (id: string, data: Partial<IUser>) =>
        set((state: { users: any[]; }) => ({
          users: state.users.map((i: { _id: string; }) =>
            i._id === id
              ? { ...i, ...data, updatedAt: new Date().toISOString() }
              : i
          ),
        })),
      deleteUser: (id: string) =>
        set((state: { users: any[]; }) => ({ users: state.users.filter((i: { _id: string; }) => i._id !== id) })),

      addIndividual: (
        data: Omit<IIndividual, "_id" | "createdAt" | "updatedAt">
      ) =>
        set((state: { individuals: any; }) => ({
          individuals: [
            ...state.individuals,
            {
              ...data,
              _id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateIndividual: (id: string, data: Partial<IIndividual>) =>
        set((state: { individuals: any[]; }) => ({
          individuals: state.individuals.map((i: { _id: string; }) =>
            i._id === id
              ? { ...i, ...data, updatedAt: new Date().toISOString() }
              : i
          ),
        })),
      deleteIndividual: (id: string) =>
        set((state: { individuals: any[]; }) => ({
          individuals: state.individuals.filter((i: { _id: string; }) => i._id !== id),
        })),

      addInvoice: (data: Omit<IInvoice, "_id" | "createdAt" | "updatedAt">) =>
        set((state: { invoices: any; }) => ({
          invoices: [
            ...state.invoices,
            {
              ...data,
              _id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateInvoice: (id: string, data: Partial<IInvoice>) =>
        set((state: { invoices: any[]; }) => ({
          invoices: state.invoices.map((i: { _id: string; }) =>
            i._id === id
              ? { ...i, ...data, updatedAt: new Date().toISOString() }
              : i
          ),
        })),
      deleteInvoice: (id: string) =>
        set((state: { invoices: any[]; }) => ({
          invoices: state.invoices.filter((i: { _id: string; }) => i._id !== id),
        })),

      addRecord: (data: Omit<IRecord, "_id" | "createdAt" | "updatedAt">) =>
        set((state: { records: any; }) => ({
          records: [
            ...state.records,
            {
              ...data,
              _id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateRecord: (id: string, data: Partial<IRecord>) =>
        set((state: { records: any[]; }) => ({
          records: state.records.map((i: { _id: string; }) =>
            i._id === id
              ? { ...i, ...data, updatedAt: new Date().toISOString() }
              : i
          ),
        })),
      deleteRecord: (id: string) =>
        set((state: { records: any[]; }) => ({
          records: state.records.filter((i: { _id: string; }) => i._id !== id),
        })),

      addUserActivity: (
        data: Omit<IUserActivity, "_id" | "createdAt" | "updatedAt">
      ) =>
        set((state: { userActivities: any; }) => ({
          userActivities: [
            ...state.userActivities,
            {
              ...data,
              _id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      /* eslint-enable @typescript-eslint/no-explicit-any */
      };
    },
    {
      name: "zaad-store-v2",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

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
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";

    root.classList.add(systemTheme);
    return;
  }

  root.classList.add(theme);
}
