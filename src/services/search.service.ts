import { CompanyRepository } from "@/repositories/company.repository";
import { EmployeeRepository } from "@/repositories/employee.repository";
import { serializeObjectIds } from "@/utils/serialization";
import connect from "@/db/mongo";

export const SearchService = {
  async search(keyword: string | null) {
    await connect();
    const companies = await CompanyRepository.searchByName(keyword);
    const employees = await EmployeeRepository.searchByName(keyword);
    
    return { 
      companies: companies.map((c: any) => serializeObjectIds(c)),
      employees: employees.map((e: any) => serializeObjectIds(e)),
    };
  },
};