import axios from "axios";
import { PAGINATION } from "@/config/pagination";

export const fetchEmployees = async (
  page: number = PAGINATION.DEFAULT_PAGE,
  limit: number = PAGINATION.LIMITS.ENTITY_LIST
) => {
  const { data } = await axios.get(`/api/employee?page=${page}&limit=${limit}`);
  return data;
};

export const fetchCompanies = async (
  page: number = PAGINATION.DEFAULT_PAGE,
  limit: number = PAGINATION.LIMITS.ENTITY_LIST
) => {
  const { data } = await axios.get(`/api/company?page=${page}&limit=${limit}`);
  return data;
};

export const fetchIndividuals = async (
  page: number = PAGINATION.DEFAULT_PAGE,
  limit: number = PAGINATION.LIMITS.ENTITY_LIST
) => {
  const { data } = await axios.get(
    `/api/individual?page=${page}&limit=${limit}`
  );
  return data;
};

export const fetchExpiryDocuments = async (
  page: number = PAGINATION.DEFAULT_PAGE,
  limit: number = PAGINATION.LIMITS.EXPIRY_DOCUMENTS
) => {
  const { data } = await axios.get(
    `/api/documents/expiry?page=${page}&limit=${limit}`
  );
  return data;
};
