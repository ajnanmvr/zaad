import axios from "axios";
import { PAGINATION } from "@/config/pagination";

export const fetchEmployees = async (
  page: number = PAGINATION.DEFAULT_PAGE,
  limit: number = PAGINATION.LIMITS.ENTITY_LIST,
  options?: {
    search?: string;
    sortBy?: "newest" | "oldest" | "name-asc" | "name-desc";
    createdWithinDays?: number;
    deleted?: boolean;
  }
) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (options?.search) {
    params.set("search", options.search);
  }

  if (options?.sortBy) {
    params.set("sortBy", options.sortBy);
  }

  if (typeof options?.createdWithinDays === "number") {
    params.set("createdWithinDays", String(options.createdWithinDays));
  }

  if (options?.deleted) {
    params.set("deleted", "true");
  }

  const { data } = await axios.get(`/api/employee?${params.toString()}`);
  return data;
};

export const fetchCompanies = async (
  page: number = PAGINATION.DEFAULT_PAGE,
  limit: number = PAGINATION.LIMITS.ENTITY_LIST,
  options?: {
    search?: string;
    sortBy?: "newest" | "oldest" | "name-asc" | "name-desc";
    createdWithinDays?: number;
    deleted?: boolean;
  }
) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (options?.search) {
    params.set("search", options.search);
  }

  if (options?.sortBy) {
    params.set("sortBy", options.sortBy);
  }

  if (typeof options?.createdWithinDays === "number") {
    params.set("createdWithinDays", String(options.createdWithinDays));
  }

  if (options?.deleted) {
    params.set("deleted", "true");
  }

  const { data } = await axios.get(`/api/company?${params.toString()}`);
  return data;
};

export const fetchIndividuals = async (
  page: number = PAGINATION.DEFAULT_PAGE,
  limit: number = PAGINATION.LIMITS.ENTITY_LIST,
  options?: {
    search?: string;
    sortBy?: "newest" | "oldest" | "name-asc" | "name-desc";
    createdWithinDays?: number;
    deleted?: boolean;
  }
) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (options?.search) {
    params.set("search", options.search);
  }

  if (options?.sortBy) {
    params.set("sortBy", options.sortBy);
  }

  if (typeof options?.createdWithinDays === "number") {
    params.set("createdWithinDays", String(options.createdWithinDays));
  }

  if (options?.deleted) {
    params.set("deleted", "true");
  }

  const { data } = await axios.get(`/api/individual?${params.toString()}`);
  return data;
};

export const fetchExpiryDocuments = async (
  page: number = PAGINATION.DEFAULT_PAGE,
  limit: number = PAGINATION.LIMITS.EXPIRY_DOCUMENTS,
  options?: {
    name?: string;
  }
) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (options?.name) {
    params.set("name", options.name);
  }

  const { data } = await axios.get(`/api/documents/expiry?${params.toString()}`);
  return data;
};

export const fetchArchivedDocuments = async (
  page: number = PAGINATION.DEFAULT_PAGE,
  limit: number = PAGINATION.LIMITS.EXPIRY_DOCUMENTS
) => {
  const { data } = await axios.get(
    `/api/documents/archived?page=${page}&limit=${limit}`
  );
  return data;
};

export const fetchHandovers = async (
  page: number = PAGINATION.DEFAULT_PAGE,
  limit: number = PAGINATION.LIMITS.ENTITY_LIST,
  search?: string,
  entityId?: string,
  status?: "pending" | "returned" | "all"
) => {
  const { data } = await axios.get(
    `/api/documents/handover?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}${entityId ? `&entityId=${entityId}` : ""}${status ? `&status=${status}` : ""}`
  );
  return data;
};
