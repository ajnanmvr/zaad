import { EmployeeRepository } from "@/repositories/employee.repository";
import { TEmployeeData, TEmployeeList } from "@/types/types";
import {
  EntityWithDocumentsService,
  processSummaryList,
} from "./entity-with-documents.service";

class EmployeeServiceClass extends EntityWithDocumentsService {
  constructor() {
    super(EmployeeRepository);
  }

  async createEmployee(data: any) {
    return this.create(data);
  }

  async listEmployeesSummaries() {
    const employees: TEmployeeData[] = (await EmployeeRepository.findPublishedWithCompany()) as any;
    return processSummaryList(employees, (employee) => ({
      company: employee.company,
    }));
  }

  async getEmployeeDetails(id: string) {
    const employee = (await EmployeeRepository.findByIdWithCompany(id)) as unknown as TEmployeeData | null;
    if (!employee) return null;

    return this.formatEntityDetails(employee, {
      name: employee.name,
      company: employee.company,
      emiratesId: employee.emiratesId,
      nationality: employee.nationality,
      phone1: employee.phone1,
      phone2: employee.phone2,
      email: employee.email,
      designation: employee.designation,
      remarks: employee.remarks,
      password: employee.password,
    });
  }

  async updateEmployee(id: string, data: any) {
    return this.updateEntity(id, data);
  }

  async deleteEmployee(id: string) {
    return this.deleteEntity(id);
  }

  async addEmployeeDocument(id: string, document: any) {
    return this.addDocument(id, document, "findByIdWithCompany");
  }

  async updateEmployeeDocument(id: string, docId: string, fields: any) {
    const employee = (await EmployeeRepository.findByIdWithCompany(id)) as any;
    if (!employee) return { employee: null, documentIndex: null };

    const result = await super.updateDocument(id, docId, fields, "findByIdWithCompany");
    return { employee, documentIndex: result.documentIndex };
  }

  async deleteEmployeeDocument(id: string, docId: string) {
    const employee = (await EmployeeRepository.findByIdWithCompany(id)) as any;
    if (!employee) return { employee: null, documentIndex: null };

    const result = await super.deleteDocument(id, docId, "findByIdWithCompany");
    return { employee, documentIndex: result.documentIndex };
  }

  async listEmployeesByCompany(companyId: string) {
    const employees: any[] = (await EmployeeRepository.findPublishedByCompany(companyId)) as any;
    return processSummaryList(employees, (employee) => ({
      company: employee.company,
    }));
  }
}

export const EmployeeService = new EmployeeServiceClass();