"use server";

import "server-only";

import { cookies } from "next/headers";
import { RecordsService } from "@/services/records.service";
import { filterData, normalizeSearchParams } from "@/utils/filterData";
import Company from "@/models/companies";
import Employee from "@/models/employees";
import Records from "@/models/records";
import { TRecordData } from "@/types/records";
import { TCompanyData, TEmployeeData } from "@/types/types";
import processCompanies from "@/helpers/processCompanies";
import processEmployees from "@/helpers/processEmployees";

import { requireAuth, requirePartner } from "@/actions/_auth";
const JWT_SECRET = process.env.JWT_SECRET; // kept for cookie usage if needed

// ============================================
// PAYMENT/RECORDS ACTIONS
// ============================================

export async function createRecordAction(payload: any) {
  await requireAuth();
  return RecordsService.createRecord(payload);
}

export async function listRecordsAction(
  method: string | null,
  type: string | null,
  page: number
) {
  await requirePartner();
  return RecordsService.listRecords(method, type, page, 25);
}

export async function getRecordAction(id: string) {
  await requirePartner();
  return RecordsService.getRecord(id);
}

export async function updateRecordAction(id: string, payload: any) {
  await requirePartner();
  return RecordsService.updateRecord(id, payload);
}

export async function deleteRecordAction(id: string) {
  await requirePartner();
  await RecordsService.deleteRecord(id);
  return { success: true };
}

export async function getPrevSuffixNumberAction() {
  await requireAuth();
  return RecordsService.getPrevSuffixNumber();
}

export async function createInstantProfitAction(payload: any) {
  await requirePartner();
  await RecordsService.createInstantProfit(payload);
  return { success: true };
}

export async function swapAccountsAction(payload: {
  amount: number;
  createdBy: string;
  to: string;
  from: string;
}) {
  await requirePartner();
  const { amount, createdBy, to, from } = payload;
  await RecordsService.swapAccounts(amount, createdBy, to, from);
  return { success: true };
}

export async function getLiabilitiesSummaryAction() {
  await requirePartner();
  return RecordsService.getLiabilitiesSummary();
}

export async function getAccountsSummaryAction(searchParams: unknown) {
  await requireAuth();
  const params = normalizeSearchParams(searchParams);
  const filter = filterData(params, true);
  return RecordsService.getAccountsSummary(filter, params.toString() === "");
}

export async function getProfitsSummaryAction(searchParams: unknown) {
  await requireAuth();
  const params = normalizeSearchParams(searchParams);
  const filter = filterData(params, false);
  
  const [companies, employees, allRecords]: [
    TCompanyData[],
    TEmployeeData[],
    TRecordData[],
  ] = await Promise.all([
    Company.find({ published: true }),
    Employee.find({ published: true }),
    Records.find(filter),
  ]);

  const companyRecords = allRecords.filter(
    (record) => record.company && record.published
  );
  const employeeRecords = allRecords.filter(
    (record) => record.employee && record.published
  );

  const {
    over0balanceCompanies,
    under0balanceCompanies,
    totalProfitAllCompanies,
    totalToGiveCompanies,
    totalToGetCompanies,
  } = processCompanies(companies, companyRecords);

  const {
    over0balanceEmployees,
    under0balanceEmployees,
    totalProfitAllEmployees,
    totalToGiveEmployees,
    totalToGetEmployees,
  } = processEmployees(employees, employeeRecords);

  const profit = totalProfitAllEmployees + totalProfitAllCompanies;
  const totalToGive = totalToGiveCompanies + totalToGiveEmployees;
  const totalToGet = totalToGetCompanies + totalToGetEmployees;

  return {
    profit,
    totalToGive,
    totalToGet,
    over0balanceCompanies,
    under0balanceCompanies,
    over0balanceEmployees,
    under0balanceEmployees,
  };
}

export async function getCompanyRecordsSummaryAction(id: string) {
  await requirePartner();
  return RecordsService.getCompanyRecordsSummary(id);
}

export async function getEmployeeRecordsSummaryAction(id: string) {
  await requirePartner();
  return RecordsService.getEmployeeRecordsSummary(id);
}

export async function getSelfRecordsSummaryAction(page: number) {
  await requirePartner();
  return RecordsService.getSelfRecordsSummary("zaad", page, 10);
}
