import connect from "@/db/connect";
import Company from "@/models/companies";
import Employee from "@/models/employees";
import Records from "@/models/records";
connect();

export async function GET() {
  try {
    // Load all necessary data
    const [companies, employees, allCompanyRecords, allEmployeeRecords] =
      await Promise.all([
        Company.find({ published: true }),
        Employee.find({ published: true }),
        Records.find({ company: { $exists: true }, published: true }),
        Records.find({ employee: { $exists: true }, published: true }),
      ]);

    // Process companies
    const {
      over0balanceCompanies,
      under0balanceCompanies,
      totalProfitAllCompanies,
      totalToGiveCompanies,
      totalToGetCompanies,
    } = processCompanies(companies, allCompanyRecords);

    // Process employees
    const {
      over0balanceEmployees,
      under0balanceEmployees,
      totalProfitAllEmployees,
      totalToGiveEmployees,
      totalToGetEmployees,
    } = processEmployees(employees, allEmployeeRecords);

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

function processCompanies(companies, allCompanyRecords) {
  let over0balanceCompanies = [];
  let under0balanceCompanies = [];
  let totalProfitAllCompanies = 0;
  let totalToGiveCompanies = 0;
  let totalToGetCompanies = 0;

  // Process companies
  for (const company of companies) {
    const companyRecords = allCompanyRecords.filter(
      (record) => record.company.toString() === company._id.toString()
    );
    let incomeTotal = 0;
    let expenseTotal = 0;

    companyRecords.forEach((record) => {
      if (record.type === "income") {
        incomeTotal +=
          record.cash + record.bank + record.tasdeed + record.swiper;
      } else if (record.type === "expense") {
        expenseTotal +=
          record.cash +
          record.bank +
          record.tasdeed +
          record.swiper +
          record.serviceFee;
      }
    });

    const balance = incomeTotal - expenseTotal;

    if (balance > 0) {
      let totalProfit = 0;
      companyRecords.forEach((record) => {
        if (record.type === "expense") {
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

function processEmployees(employees, allEmployeeRecords) {
  let over0balanceEmployees = [];
  let under0balanceEmployees = [];
  let totalProfitAllEmployees = 0;
  let totalToGiveEmployees = 0;
  let totalToGetEmployees = 0;

  // Process employees
  for (const employee of employees) {
    const employeeRecords = allEmployeeRecords.filter(
      (record) => record.employee.toString() === employee._id.toString()
    );
    let incomeTotal = 0;
    let expenseTotal = 0;
    let totalProfit = 0; // Track total profit for the employee

    employeeRecords.forEach((record) => {
      if (record.type === "income") {
        incomeTotal += record.amount;
      } else if (record.type === "expense") {
        expenseTotal += record.amount;
        totalProfit += record.serviceFee;
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
