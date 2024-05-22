import connect from "@/db/connect";
import Company from "@/models/companies";
import Employee from "@/models/employees";
import Records from "@/models/records";
import { TRecordData } from "@/types/records";
import { TCompanyData, TEmployeeData } from "@/types/types";

connect();

export async function GET() {
  try {
    const [companies, employees, allRecords]: [
      TCompanyData[],
      TEmployeeData[],
      TRecordData[],
    ] = await Promise.all([
      Company.find({ published: true }),
      Employee.find({ published: true }),
      Records.find({ published: true }),
    ]);

    // Filter records for companies and employees
    const companyRecords = allRecords.filter((record) => record.company);
    const employeeRecords = allRecords.filter((record) => record.employee);

    // Process companies
    const {
      over0balanceCompanies,
      under0balanceCompanies,
      totalProfitAllCompanies,
      totalToGiveCompanies,
      totalToGetCompanies,
    } = processCompanies(companies, companyRecords);

    // Process employees
    const {
      over0balanceEmployees,
      under0balanceEmployees,
      totalProfitAllEmployees,
      totalToGiveEmployees,
      totalToGetEmployees,
    } = processEmployees(employees, employeeRecords);

    // Calculate overall profits and amounts to give/get
    const profit = totalProfitAllEmployees + totalProfitAllCompanies;
    const totalToGive = totalToGiveCompanies + totalToGiveEmployees;
    const totalToGet = totalToGetCompanies + totalToGetEmployees;

    return Response.json(
      {
        over0balanceCompanies,
        under0balanceCompanies,
        totalProfitAllCompanies,
        totalToGiveCompanies,
        totalToGetCompanies,
        over0balanceEmployees,
        under0balanceEmployees,
        totalProfitAllEmployees,
        totalToGiveEmployees,
        totalToGetEmployees,
        profit,
        totalToGive,
        totalToGet,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}

function processCompanies(
  companies: TCompanyData[],
  companyRecords: TRecordData[]
) {
  let over0balanceCompanies = [];
  let under0balanceCompanies = [];
  let totalProfitAllCompanies = 0;
  let totalToGiveCompanies = 0;
  let totalToGetCompanies = 0;

  // Process companies
  for (const company of companies) {
    const companyId = company._id?.toString();
    if (!companyId) continue; // Skip if company._id is undefined

    const companyRecordsFiltered = companyRecords.filter(
      (record) => record.company?.toString() === companyId
    );
    let incomeTotal = 0;
    let expenseTotal = 0;

    companyRecordsFiltered.forEach((record) => {
      if (record.type === "income") {
        incomeTotal += record.amount;
      } else if (record.type === "expense") {
        expenseTotal += record.amount;
      }
    });

    const balance = incomeTotal - expenseTotal;

    if (balance > 0) {
      let totalProfit = 0;
      companyRecordsFiltered.forEach((record) => {
        if (record.type === "expense" && record.serviceFee) {
          totalProfit += record.serviceFee;
        }
      });
      over0balanceCompanies.push({
        id: company._id,
        name: company.name,
        balance,
        totalProfit,
      });
      totalProfitAllCompanies += totalProfit;
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

  return {
    over0balanceCompanies,
    under0balanceCompanies,
    totalProfitAllCompanies,
    totalToGiveCompanies,
    totalToGetCompanies,
  };
}

function processEmployees(
  employees: TEmployeeData[],
  employeeRecords: TRecordData[]
) {
  let over0balanceEmployees = [];
  let under0balanceEmployees = [];
  let totalProfitAllEmployees = 0;
  let totalToGiveEmployees = 0;
  let totalToGetEmployees = 0;

  // Process employees
  for (const employee of employees) {
    const employeeId = employee._id?.toString();
    if (!employeeId) continue; // Skip if employee._id is undefined

    const employeeRecordsFiltered = employeeRecords.filter(
      (record) => record.employee?.toString() === employeeId
    );
    let incomeTotal = 0;
    let expenseTotal = 0;
    let totalProfit = 0; // Track total profit for the employee

    employeeRecordsFiltered.forEach((record) => {
      if (record.type === "income") {
        incomeTotal += record.amount;
      } else if (record.type === "expense") {
        expenseTotal += record.amount;
        if (record.serviceFee) {
          totalProfit += record.serviceFee;
        }
      }
    });

    const balance = incomeTotal - expenseTotal;

    if (balance > 0) {
      over0balanceEmployees.push({
        id: employee._id,
        name: employee.name,
        balance,
        totalProfit, // Include total profit for this employee
      });
      totalProfitAllEmployees += totalProfit; // Update total profit for all employees
      totalToGiveEmployees += balance;
    } else if (balance < 0) {
      under0balanceEmployees.push({
        id: employee._id,
        name: employee.name,
        balance,
        totalProfit, // Include total profit for this employee
      });
      totalToGetEmployees += balance;
    }
  }

  return {
    over0balanceEmployees,
    under0balanceEmployees,
    totalProfitAllEmployees,
    totalToGiveEmployees,
    totalToGetEmployees,
  };
}
