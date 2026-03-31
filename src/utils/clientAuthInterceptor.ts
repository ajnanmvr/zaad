"use client";

import axios, { AxiosError } from "axios";

let isConfigured = false;
let refreshPromise: Promise<void> | null = null;

function shouldSkipRefresh(url?: string) {
  if (!url) {
    return false;
  }

  return (
    url.includes("/api/users/auth/login") ||
    url.includes("/api/users/auth/refresh") ||
    url.includes("/api/users/auth/logout") ||
    url.includes("/api/users/auth/logout-all")
  );
}

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function configureClientAuthInterceptor() {
  if (isConfigured || typeof window === "undefined") {
    return;
  }

  isConfigured = true;
  axios.defaults.withCredentials = true;

  axios.interceptors.request.use((config) => {
    const csrfToken = readCookie("csrf-token");
    if (csrfToken) {
      config.headers = config.headers || {};
      (config.headers as any)["x-csrf-token"] = csrfToken;
    }
    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const originalRequest = error.config as any;

      if (!originalRequest || originalRequest._retry || status !== 401) {
        return Promise.reject(error);
      }

      if (shouldSkipRefresh(originalRequest.url)) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post("/api/users/auth/refresh")
            .then(() => undefined)
            .finally(() => {
              refreshPromise = null;
            });
        }

        await refreshPromise;
        return axios(originalRequest);
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
  );
}
