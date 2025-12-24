import { EmployeeRepository } from "@/repositories/employee.repository";
import { TEmployeeData } from "@/types/types";
import {
  EntityWithDocumentsService,
  processSummaryList,
} from "./entity-with-documents.service";
import { serializeObjectIds } from "@/utils/serialization";
import connect from "@/db/mongo";

class EmployeeServiceClass extends EntityWithDocumentsService {
  constructor() {
    super(EmployeeRepository);
  }

  async createEmployee(data: any) {
    return this.create(data);
  }

  async listEmployeesSummaries() {
    await connect();
    const employees: TEmployeeData[] = (await EmployeeRepository.findPublishedWithCompany()) as any;
    return processSummaryList(employees, (employee) => ({
      company: employee.company,
    }));
  }

  async getEmployeeDetails(id: string) {
    await connect();
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
    return this.addDocument(id, document, "findByIdWithCompanyForUpdate");
  }

  async updateEmployeeDocument(id: string, docId: string, fields: any) {
    const result = await super.updateDocument(id, docId, fields, "findByIdWithCompanyForUpdate");
    return { employee: result.entity, documentIndex: result.documentIndex };
  }

  async deleteEmployeeDocument(id: string, docId: string) {
    const result = await super.deleteDocument(id, docId, "findByIdWithCompanyForUpdate");
    return { employee: result.entity, documentIndex: result.documentIndex };
  }

  async listEmployeesByCompany(companyId: string) {
    await connect();
    const employees: any[] = (await EmployeeRepository.findPublishedByCompany(companyId)) as any;
    return processSummaryList(employees, (employee) => ({
      company: employee.company ? serializeObjectIds(employee.company) : undefined,
    }));
  }
}

export const EmployeeService = new EmployeeServiceClass();