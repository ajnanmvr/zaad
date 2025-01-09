import { TCompanyList } from "@/types/types";
import axios from "axios";

export const fetchCountData = async () => {
  const { data } = await axios.get("/api/home/expiry");
  return data;
};

export const fetchEmployees = async () => {
  const { data } = await axios.get("/api/employee");
  return data.data;
};

export const fetchCompanies = async () => {
  const { data } = await axios.get("/api/company");
  return data.data;
};
