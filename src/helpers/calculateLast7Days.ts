import { TRecordDataWithCreatedAt } from "@/types/records";

export default function calculateLast7Days(
  expenseRecords: TRecordDataWithCreatedAt[],
  last7DaysDates: Date[]
): [number[], number[]] {
  const expensesLast7DaysTotal: number[] = [];
  const profitLast7DaysTotal: number[] = [];

  last7DaysDates.forEach((date) => {
    const expensesTotal: number = expenseRecords
      .filter(
        (record) =>
          new Date(record.createdAt).toDateString() === date.toDateString()
      )
      .reduce(
        (total, record) => total + (record.amount || 0), // Assuming 'amount' is the correct field for expenses
        0
      );
    expensesLast7DaysTotal.push(expensesTotal);

    // Assuming there's a service fee field in the record
    const profitTotal: number = expenseRecords
      .filter(
        (record) =>
          new Date(record.createdAt).toDateString() === date.toDateString()
      )
      .reduce((total, record) => total + (record.serviceFee || 0), 0);
    profitLast7DaysTotal.push(profitTotal);
  });

  console.log();
  return [expensesLast7DaysTotal, profitLast7DaysTotal];
}
