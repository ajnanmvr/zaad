import { create } from "zustand";
import { authService } from "@/lib/api-services";
import type { User } from "@/lib/schemas";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authService.login(email, password);
      if (response.user) {
        set({ user: response.user });
        localStorage.setItem("zaad-refresh-token", response.tokens?.refreshToken);
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      set({ error: err.message || "Login failed" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      const refreshToken = localStorage.getItem("zaad-refresh-token");
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      set({ user: null });
      localStorage.removeItem("zaad-auth-token");
      localStorage.removeItem("zaad-refresh-token");
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      set({ error: err.message || "Logout failed" });
    } finally {
      set({ isLoading: false });
    }
  },

  getCurrentUser: async () => {
    try {
      set({ isLoading: true, error: null });
      const user = await authService.getCurrentUser();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set({ user: user as any });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      set({ error: err.message || "Failed to fetch user" });
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user: User | null) => set({ user }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
}));

// Filter/pagination state
interface FilterState {
  page: number;
  limit: number;
  search: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface DataStore<T> {
  items: T[];
  total: number;
  filter: FilterState;
  isLoading: boolean;
  error: string | null;
  setItems: (items: T[]) => void;
  setTotal: (total: number) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const createDataStore = <T extends { _id?: string; id?: string }>() =>
  create<DataStore<T>>((set) => ({
    items: [],
    total: 0,
    filter: { page: 1, limit: 10, search: "" },
    isLoading: false,
    error: null,

    setItems: (items: T[]) => set({ items }),
    setTotal: (total: number) => set({ total }),
    setFilter: (filter: Partial<FilterState>) =>
      set((state) => ({
        filter: { ...state.filter, ...filter },
      })),
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setError: (error: string | null) => set({ error }),
  }));

// Create separate stores for each resource
export const useCompanyStore = createDataStore();
export const useEmployeeStore = createDataStore();
export const useIndividualStore = createDataStore();
export const useDocumentStore = createDataStore();
export const useTaskStore = createDataStore();
export const useInvoiceStore = createDataStore();
export const useLiabilityStore = createDataStore();
export const useRecordStore = createDataStore();
export const useZaadExpenseStore = createDataStore();
export const useUserStore = createDataStore();
