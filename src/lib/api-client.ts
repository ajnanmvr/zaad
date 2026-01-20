import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api/v1';

export const API_URL = `${API_BASE_URL}${API_PREFIX}`;

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

interface RetryAxiosRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ================= REQUEST ================= */
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================= RESPONSE ================= */
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config as RetryAxiosRequest;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const res = await axios.post<{ data: { accessToken: string } }>(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = res.data.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);

        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

/* ================= ERROR NORMALIZER ================= */
function normalizeError(
  error: AxiosError<ApiErrorResponse>
): ApiError {
  return {
    message:
      error.response?.data?.message ??
      error.message ??
      'Something went wrong',
    status: error.response?.status ?? 0,
    errors: error.response?.data?.errors,
  };
}

export default apiClient;
