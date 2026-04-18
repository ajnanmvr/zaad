import { findPublishedRecordsByCompany } from "@/repositories/recordRepository";
import { searchPublishedCompaniesByName } from "@/repositories/companyRepository";

export async function searchCompaniesByName(search: string) {
  return searchPublishedCompaniesByName(search);
}

export async function getCompanyBalance(companyId: string) {
  const companyRecords = await findPublishedRecordsByCompany(companyId);

  let incomeTotal = 0;
  let expenseTotal = 0;

  companyRecords.forEach((record: any) => {
    if (record.type === "income") {
      incomeTotal += record.amount;
      return;
    }

    if (record.type === "expense") {
      expenseTotal += record.amount + (record.serviceFee ?? 0);
    }
  });

  return incomeTotal - expenseTotal;
}
