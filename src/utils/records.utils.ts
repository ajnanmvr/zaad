/**
 * Records Service Utilities
 * Shared logic for record transformation and calculations
 */

import { toZonedTime, format } from "date-fns-tz";

const DUBAI_TIME_ZONE = "Asia/Dubai";

/**
 * Client type for records
 */
export interface Client {
  name: string;
  id: string;
  type: "company" | "employee" | "self";
}

/**
 * Transform record to API response format
 */
export const transformRecord = (record: any): any => {
  const client = extractClient(record);
  const createdAtInDubai = toZonedTime(record.createdAt, DUBAI_TIME_ZONE);

  return {
    id: record._id,
    type: record.type,
    client,
    method: record.method,
    particular: record.particular,
    invoiceNo: record.invoiceNo,
    amount: record.amount?.toFixed(2),
    serviceFee: record.serviceFee?.toFixed(2),
    creator: record?.createdBy?.username,
    status: record.status,
    number: record.number,
    suffix: record.suffix,
    edited: record.edited,
    date: format(createdAtInDubai, "MMM-dd hh:mma", {
      timeZone: DUBAI_TIME_ZONE,
    }),
  };
};

/**
 * Extract client info from record
 */
export const extractClient = (record: any): Client | null => {
  const { company, employee, self } = record;
  if (company) {
    return { name: company.name, id: company._id, type: "company" };
  }
  if (employee) {
    return { name: employee.name, id: employee._id, type: "employee" };
  }
  if (self) {
    return { name: self, type: "self" };
  }
  return null;
};

/**
 * Calculate balance for records
 */
export const calculateBalance = (records: any[]): number => {
  let incomeTotal = 0;
  let expenseTotal = 0;

  records.forEach((record) => {
    if (record.type === "income") {
      incomeTotal += record.amount || 0;
    } else if (record.type === "expense") {
      expenseTotal += (record.amount || 0) + (record.serviceFee || 0);
    }
  });

  return incomeTotal - expenseTotal;
};

/**
 * Calculate totals from records
 */
export const calculateRecordTotals = (
  records: any[]
): {
  totalIncome: number;
  totalExpense: number;
  balance: number;
} => {
  let totalIncome = 0;
  let totalExpense = 0;

  records.forEach((record) => {
    if (record.type === "income" && record.method !== "liability") {
      totalIncome += record.amount || 0;
    } else if (record.type === "expense") {
      totalExpense += (record.amount || 0) + (record.serviceFee || 0);
    }
  });

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
};

/**
 * Build empty records summary response
 */
export const emptyRecordsSummary = (hasMore = false) => ({
  message: "No records found",
  count: 0,
  records: [],
  balance: 0,
  totalIncome: 0,
  totalExpense: 0,
  totalTransactions: 0,
  ...(hasMore && { hasMore }),
});
