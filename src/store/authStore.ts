import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  status: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: User) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitialized: false,
  setAuth: (user, accessToken) =>
    set({
      user,
      accessToken,
      isAuthenticated: true,
    }),
  setAccessToken: (accessToken) =>
    set({
      accessToken,
    }),
  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    }),
  updateUser: (user) =>
    set({
      user,
    }),
  setInitialized: (initialized) =>
    set({
      isInitialized: initialized,
    }),
}));
