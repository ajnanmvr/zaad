import { TRecordData } from "@/types/records";
import { TCompanyData } from "@/types/types";

export default function processCompanies(
  companies: TCompanyData[],
  companyRecords: TRecordData[]
) {
  let over0balanceCompanies = [];
  let under0balanceCompanies = [];
  let totalProfitAllCompanies = 0;
  let totalToGiveCompanies = 0;
  let totalToGetCompanies = 0;
  let advanceCompanies = 0;

  // Process companies
  for (const company of companies) {
    const companyId = company._id?.toString();
    if (!companyId) continue;

    const companyRecordsFiltered = companyRecords.filter(
      (record) => record.company?.toString() === companyId
    );
    let incomeTotal = 0;
    let expenseTotal = 0;

    companyRecordsFiltered.forEach((record) => {
      if (record.type === "income") {
        if (record.status === "Advance") {
          advanceCompanies += record.amount;
        } else {
          incomeTotal += record.amount;
        }
      } else if (record.type === "expense") {
        expenseTotal += record.amount + (record.serviceFee ?? 0);
      }
    });

    const balance = incomeTotal - expenseTotal;

    if (balance > 0) {
      let serviceFee = 0;
      companyRecordsFiltered.forEach((record) => {
        if (record.type === "expense" && record.serviceFee) {
          serviceFee += record.serviceFee;
        }
      });
      over0balanceCompanies.push({
        id: company._id,
        name: company.name,
        balance,
        serviceFee,
      });
      totalProfitAllCompanies += serviceFee;
      totalToGiveCompanies += balance;
    } else if (balance < 0) {
      under0balanceCompanies.push({
        id: company._id,
        name: company.name,
        balance,
      });
      totalToGetCompanies += balance;
    }
  }

  over0balanceCompanies.sort((a, b) => a.name.localeCompare(b.name));
  under0balanceCompanies.sort((a, b) => a.name.localeCompare(b.name));

  return {
    over0balanceCompanies,
    under0balanceCompanies,
    totalProfitAllCompanies,
    totalToGiveCompanies,
    totalToGetCompanies,
    advanceCompanies,
  };
}
