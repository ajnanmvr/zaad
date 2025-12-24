"use server";

import "server-only";

import { cookies } from "next/headers";
import { CompanyService } from "@/services/company.service";
import { CompanyRepository } from "@/repositories/company.repository";
import { EmployeeService } from "@/services/employee.service";
import { EmployeeRepository } from "@/repositories/employee.repository";
import { RecordsService } from "@/services/records.service";
import { serializeObjectIds } from "@/utils/serialization";
import { requireAuth } from "@/actions/_auth";

const JWT_SECRET = process.env.JWT_SECRET; // kept if other code needs it


export async function createCompanyAction(payload: any) {
  await requireAuth();
  return CompanyService.createCompany(payload);
}

export async function listCompaniesAction() {
  await requireAuth();
  return CompanyService.listCompanySummaries();
}

export async function getCompanyAction(id: string) {
  await requireAuth();
  const data = await CompanyService.getCompanyDetails(id);
  if (!data) throw new Error("Company not found");
  return data;
}

export async function updateCompanyAction(id: string, payload: any) {
  await requireAuth();
  await CompanyService.updateCompany(id, payload);
  return { success: true };
}

export async function deleteCompanyAction(id: string) {
  await requireAuth();
  await CompanyService.deleteCompany(id);
  return { success: true };
}

export async function searchCompaniesAction(search: string) {
  await requireAuth();
  const results = await CompanyRepository.searchByName(search);
  return results.map((r: any) => serializeObjectIds(r));
}

export async function getCompanyBalanceAction(id: string) {
  await requireAuth();
  const { balance } = await RecordsService.getCompanyBalance(id);
  return { balance };
}

export async function addCompanyDocumentAction(id: string, document: any) {
  await requireAuth();
  const data = await CompanyService.addCompanyDocument(id, document);
  if (!data) throw new Error("Company not found");
  return data;
}

export async function updateCompanyDocumentAction(
  id: string,
  docId: string,
  fields: any
) {
  await requireAuth();
  const { company, documentIndex } = await CompanyService.updateCompanyDocument(
    id,
    docId,
    fields
  );
  if (!company) throw new Error("Company not found");
  if (documentIndex === null) throw new Error("Document not found");
  return company;
}

export async function deleteCompanyDocumentAction(id: string, docId: string) {
  await requireAuth();
  const { company, documentIndex } = await CompanyService.deleteCompanyDocument(
    id,
    docId
  );
  if (!company) throw new Error("Company not found");
  if (documentIndex === null) throw new Error("Document not found");
  return { success: true };
}

// ============================================
// EMPLOYEE ACTIONS
// ============================================

export async function createEmployeeAction(payload: any) {
  await requireAuth();
  return EmployeeService.createEmployee(payload);
}

export async function listEmployeesAction() {
  await requireAuth();
  return EmployeeService.listEmployeesSummaries();
}

export async function getEmployeeAction(id: string) {
  await requireAuth();
  const data = await EmployeeService.getEmployeeDetails(id);
  if (!data) throw new Error("Employee not found");
  return data;
}

export async function updateEmployeeAction(id: string, payload: any) {
  await requireAuth();
  await EmployeeService.updateEmployee(id, payload);
  return { success: true };
}

export async function deleteEmployeeAction(id: string) {
  await requireAuth();
  await EmployeeService.deleteEmployee(id);
  return { success: true };
}

export async function searchEmployeesAction(search: string) {
  await requireAuth();
  const results = await EmployeeRepository.searchByName(search);
  return results.map((r: any) => serializeObjectIds(r));
}

export async function getEmployeeBalanceAction(id: string) {
  await requireAuth();
  const { balance } = await RecordsService.getEmployeeBalance(id);
  return { balance };
}

export async function listEmployeesByCompanyAction(companyId: string) {
  await requireAuth();
  return EmployeeService.listEmployeesByCompany(companyId);
}

export async function addEmployeeDocumentAction(id: string, document: any) {
  await requireAuth();
  const data = await EmployeeService.addEmployeeDocument(id, document);
  if (!data) throw new Error("Employee not found");
  return data;
}

export async function updateEmployeeDocumentAction(
  id: string,
  docId: string,
  fields: any
) {
  await requireAuth();
  const { employee, documentIndex } = await EmployeeService.updateEmployeeDocument(
    id,
    docId,
    fields
  );
  if (!employee) throw new Error("Employee not found");
  if (documentIndex === null) throw new Error("Document not found");
  return employee;
}

export async function deleteEmployeeDocumentAction(id: string, docId: string) {
  await requireAuth();
  const { employee, documentIndex } = await EmployeeService.deleteEmployeeDocument(
    id,
    docId
  );
  if (!employee) throw new Error("Employee not found");
  if (documentIndex === null) throw new Error("Document not found");
  return { success: true };
}
