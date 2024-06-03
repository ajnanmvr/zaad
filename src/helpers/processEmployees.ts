import { TRecordData } from "@/types/records";
import { TEmployeeData } from "@/types/types";

export default function processEmployees(
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
    if (!employeeId) continue;

    const employeeRecordsFiltered = employeeRecords.filter(
      (record) => record.employee?.toString() === employeeId
    );
    let incomeTotal = 0;
    let expenseTotal = 0;
    let serviceFee = 0;
    let advanceTotal = 0;

    employeeRecordsFiltered.forEach((record) => {
      if (record.type === "income") {
        if (record.status === "Advance") {
          advanceTotal += record.amount;
        } else {
          incomeTotal += record.amount;
        }
      } else if (record.type === "expense") {
        expenseTotal += record.amount + (record.serviceFee ?? 0);
        if (record.serviceFee) {
          serviceFee += record.serviceFee;
        }
      }
    });

    const balance = incomeTotal - expenseTotal;

    if (balance > 0) {
      over0balanceEmployees.push({
        id: employee._id,
        name: employee.name,
        balance,
        serviceFee,
      });
      totalProfitAllEmployees += serviceFee;
      totalToGiveEmployees += balance;
    } else if (balance < 0) {
      under0balanceEmployees.push({
        id: employee._id,
        name: employee.name,
        balance,
        serviceFee,
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
