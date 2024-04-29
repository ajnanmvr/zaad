import connect from "@/db/connect";
import Company from "@/models/companies";
import Employee from "@/models/employees";
import Records from "@/models/records";
connect();

export async function GET() {
  try {
    const companies = await Company.find({ published: true });
    const employees = await Employee.find({ published: true });
    const over0balanceCompanies = [];
    const under0balanceCompanies = [];
    const over0balanceEmployees = [];
    const under0balanceEmployees = [];
    let totalProfitAllCompanies = 0;
    let totalToGiveCompanies = 0;
    let totalToGetCompanies = 0;
    let totalProfitAllEmployees = 0;
    let totalToGiveEmployees = 0;
    let totalToGetEmployees = 0;

    // Process companies
    for (const company of companies) {
      const companyRecords = await Records.find({
        company: { _id: company.id },
        published: true,
      });
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
          company: company.name,
          balance,
          totalProfit,
        });
        totalProfitAllCompanies += totalProfit;
        totalToGiveCompanies += balance;
      } else if (balance < 0) {
        under0balanceCompanies.push({
          company: company.name,
          balance,
        });
        totalToGetCompanies += balance;
      }
    }

    // Process employees similar to companies
    for (const employee of employees) {
      const employeeRecords = await Records.find({
        employee: { _id: employee.id },
        published: true,
      });
      let incomeTotal = 0;
      let expenseTotal = 0;
      let totalProfit = 0; // Track total profit for the employee

      employeeRecords.forEach((record) => {
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

          // Calculate profit for this expense record
          totalProfit += record.serviceFee;
        }
      });

      const balance = incomeTotal - expenseTotal;

      if (balance > 0) {
        over0balanceEmployees.push({
          employee: employee.name,
          balance,
          totalProfit, // Include total profit for this employee
        });
        totalProfitAllEmployees += totalProfit; // Update total profit for all employees
        totalToGiveEmployees += balance;
      } else if (balance < 0) {
        under0balanceEmployees.push({
          employee: employee.name,
          balance,
          totalProfit, // Include total profit for this employee
        });
        totalToGetEmployees += balance;
      }
    }
    const profit = totalProfitAllEmployees + totalProfitAllCompanies;
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
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
