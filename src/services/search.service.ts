import { CompanyRepository } from "@/repositories/company.repository";
import { EmployeeRepository } from "@/repositories/employee.repository";

export const SearchService = {
  async search(keyword: string | null) {
    const companies = await CompanyRepository.searchByName(keyword);
    const employees = await EmployeeRepository.searchByName(keyword);
    return { companies, employees };
  },
};