import { EmployeeRepository } from "@/repositories/employee.repository";
import calculateStatus from "@/utils/calculateStatus";
import processDocuments from "@/helpers/processDocuments";
import { TEmployeeData, TEmployeeList, TDocuments } from "@/types/types";

export const EmployeeService = {
  async createEmployee(data: any) {
    return EmployeeRepository.create(data);
  },

  async listEmployeesSummaries() {
    const employees: TEmployeeData[] = (await EmployeeRepository.findPublishedWithCompany()) as any;
    const data: TEmployeeList[] = [];

    employees.forEach((employee: any) => {
      const { expiryDate, docsCount } = processDocuments(employee.documents);
      const status = calculateStatus(expiryDate);
      data.push({
        id: employee._id,
        name: employee.name,
        company: employee.company,
        expiryDate,
        docs: docsCount,
        status,
      });
    });

    data.sort((a, b) =>
      a.expiryDate === "---"
        ? 1
        : b.expiryDate === "---"
        ? -1
        : new Date(a.expiryDate as string).getTime() - new Date(b.expiryDate as string).getTime()
    );

    return { count: employees.length, data };
  },

  async getEmployeeDetails(id: string) {
    const employee = (await EmployeeRepository.findByIdWithCompany(id)) as unknown as TEmployeeData | null;
    if (!employee) return null;

    const modifiedDocuments = employee.documents.map((document: TDocuments) => ({
      _id: (document as any)._id,
      name: document.name,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      status: calculateStatus(document.expiryDate!),
    }));

    modifiedDocuments.sort(
      (a, b) => new Date(a.expiryDate as string).getTime() - new Date(b.expiryDate as string).getTime()
    );

    return {
      id: (employee as any)._id,
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
      documents: modifiedDocuments,
    };
  },

  async updateEmployee(id: string, data: any) {
    return EmployeeRepository.updateById(id, data);
  },

  async deleteEmployee(id: string) {
    return EmployeeRepository.softDelete(id);
  },

  async addEmployeeDocument(id: string, document: any) {
    const employee = (await EmployeeRepository.findByIdWithCompany(id)) as any;
    if (!employee) return null;
    employee.documents.push(document);
    await employee.save();
    return employee;
  },

  async updateEmployeeDocument(id: string, docId: string, fields: any) {
    const employee = (await EmployeeRepository.findByIdWithCompany(id)) as any;
    if (!employee) return { employee: null, documentIndex: null };

    const documentIndex = employee.documents.findIndex((d: any) => d._id.toString() === docId);
    if (documentIndex === -1) return { employee, documentIndex: null };

    const doc = employee.documents[documentIndex];
    const { name, issueDate, expiryDate, attachment } = fields;
    if (name !== undefined) doc.name = name;
    if (issueDate !== undefined) doc.issueDate = issueDate;
    if (expiryDate !== undefined) doc.expiryDate = expiryDate;
    if (attachment !== undefined) doc.attachment = attachment;

    await employee.save();
    return { employee, documentIndex };
  },

  async deleteEmployeeDocument(id: string, docId: string) {
    const employee = (await EmployeeRepository.findByIdWithCompany(id)) as any;
    if (!employee) return { employee: null, documentIndex: null };

    const documentIndex = employee.documents.findIndex((d: any) => d._id.toString() === docId);
    if (documentIndex === -1) return { employee, documentIndex: null };

    employee.documents.splice(documentIndex, 1);
    await employee.save();

    return { employee, documentIndex };
  },

  async listEmployeesByCompany(companyId: string) {
    const employees: any[] = await EmployeeRepository.findPublishedByCompany(companyId) as any;
    const data: TEmployeeList[] = [];

    employees.forEach((employee) => {
      const { expiryDate, docsCount } = processDocuments(employee.documents);
      const status = calculateStatus(expiryDate);
      data.push({
        id: employee._id,
        name: employee.name,
        company: employee.company,
        expiryDate,
        docs: docsCount,
        status,
      });
    });

    data.sort((a, b) =>
      a.expiryDate === "---"
        ? 1
        : b.expiryDate === "---"
        ? -1
        : new Date(a.expiryDate as string).getTime() - new Date(b.expiryDate as string).getTime()
    );

    return { count: employees.length, data };
  },
};