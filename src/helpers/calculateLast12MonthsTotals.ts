import { TRecordDataWithCreatedAt } from "@/types/records";

async function calculateLast12MonthsTotals(
  expenseRecords: TRecordDataWithCreatedAt[],
  last12Months: { month: number; name: string; year: number }[]
): Promise<[number[], number[]]> {
  const last12MonthsExpenses: number[] = Array.from({ length: 12 }, () => 0);
  const last12MonthsProfit: number[] = Array.from({ length: 12 }, () => 0);

  await Promise.all(
    last12Months.map(async ({ month, year }, index) => {
      const expensesTotal: number = parseFloat(
        expenseRecords
          .filter(
            (record) =>
              new Date(record?.createdAt).getMonth() + 1 === month &&
              new Date(record?.createdAt).getFullYear() === year &&
              record?.self === "zaad"
          )
          .reduce(
            (total, record) => total + (record.amount || 0), // Assuming 'amount' is the correct field for expenses
            0
          )
          .toFixed(2)
      );
      last12MonthsExpenses[index] = expensesTotal;

      // Assuming there's a service fee field in the record
      const profitTotal: number = parseFloat(
        expenseRecords
          .filter(
            (record) =>
              new Date(record.createdAt).getMonth() + 1 === month &&
              new Date(record.createdAt).getFullYear() === year
          )
          .reduce((total, record) => total + (record.serviceFee || 0), 0)
          .toFixed(2)
      );
      last12MonthsProfit[index] = profitTotal;
    })
  );

  return [last12MonthsExpenses, last12MonthsProfit];
}

export default calculateLast12MonthsTotals;
