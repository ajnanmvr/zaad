import { listEmployeesAction, listCompaniesAction } from "@/actions/company-employee";

export const fetchEmployees = async () => {
  const result = await listEmployeesAction();
  return result.data;
};

export const fetchCompanies = async () => {
  const result = await listCompaniesAction();
  return result.data;
};
