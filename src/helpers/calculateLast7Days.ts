import { TRecordDataWithCreatedAt } from "@/types/records";

export default function calculateLast7Days(
  expenseRecords: TRecordDataWithCreatedAt[],
  last7DaysDates: Date[]
): [number[], number[]] {
  const expensesLast7DaysTotal: number[] = [];
  const profitLast7DaysTotal: number[] = [];

  last7DaysDates.forEach((date) => {
    const expensesTotal: number = parseFloat(
      expenseRecords
        .filter(
          (record) =>
            new Date(record.createdAt).toDateString() === date.toDateString()
        )
        .reduce(
          (total, record) => total + (record.amount || 0), // Assuming 'amount' is the correct field for expenses
          0
        )
        .toFixed(2)
    );
    expensesLast7DaysTotal.push(expensesTotal);

    // Assuming there's a service fee field in the record
    const profitTotal: number = parseFloat(
      expenseRecords
        .filter(
          (record) =>
            new Date(record.createdAt).toDateString() === date.toDateString()
        )
        .reduce((total, record) => total + (record.serviceFee || 0), 0)
        .toFixed(2)
    );
    profitLast7DaysTotal.push(profitTotal);
  });

  return [expensesLast7DaysTotal, profitLast7DaysTotal];
}
