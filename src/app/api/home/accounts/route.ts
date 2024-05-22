import connect from "@/db/connect";
import Records from "@/models/records"; // Assuming TRecordData is the correct type for your Records model
import { TRecordData } from "@/types/records";
connect();

export async function GET(): Promise<Response> {
  try {
    const allRecords: TRecordData[] = await Records.find({ published: true });

    const expenseRecords: TRecordData[] = allRecords.filter(
      (record) => record.type === "expense"
    );
    const incomeRecords: TRecordData[] = allRecords.filter(
      (record) => record.type === "income"
    );

    const expenseCount: number = expenseRecords.length;
    const incomeCount: number = incomeRecords.length;

    let BankExpense: number = 0,
      CashExpense: number = 0,
      TasdeedExpense: number = 0,
      SwiperExpense: number = 0,
      BankIncome: number = 0,
      CashIncome: number = 0,
      TasdeedIncome: number = 0,
      SwiperIncome: number = 0;

    incomeRecords.forEach((record) => {
      switch (record.method) {
        case "bank":
          BankIncome += record.amount || 0;
          break;
        case "cash":
          CashIncome += record.amount || 0;
          break;
        case "tasdeed":
          TasdeedIncome += record.amount || 0;
          break;
        case "swiper":
          SwiperIncome += record.amount || 0;
          break;
        default:
          break;
      }
    });

    expenseRecords.forEach((record) => {
      switch (record.method) {
        case "bank":
          BankExpense += record.amount || 0;
          break;
        case "cash":
          CashExpense += record.amount || 0;
          break;
        case "tasdeed":
          TasdeedExpense += record.amount || 0;
          break;
        case "swiper":
          SwiperExpense += record.amount || 0;
          break;
        default:
          break;
      }
    });

    const currentDate: Date = new Date();
    const currentYear: number = currentDate.getFullYear();

    const last7DaysDates: Date[] = [];
    const daysOfWeekInitials: string[] = [];

    for (let i: number = 6; i >= 0; i--) {
      const date: Date = new Date(currentDate);
      date.setDate(currentDate.getDate() - i);
      last7DaysDates.push(date);
      const dayInitial: string = date
        .toLocaleString("en-US", { weekday: "short" })[0]
        .toUpperCase();
      daysOfWeekInitials.push(dayInitial);
    }

    const [expensesLast7DaysTotal, profitLast7DaysTotal] = calculateLast7Days(
      expenseRecords,
      last7DaysDates
    );

    const last12Months: { month: number; name: string; year: number }[] =
      calculateLast12Months(currentDate, currentYear);

    const [last12MonthsExpenses, last12MonthsProfit] =
      await calculateLast12MonthsTotals(expenseRecords, last12Months);

    const monthNames: string[] = last12Months.map(({ name }) => name),
      totalIncomeAmount: number =
        BankIncome + CashIncome + TasdeedIncome + SwiperIncome,
      totalExpenseAmount: number =
        BankExpense + CashExpense + TasdeedExpense + SwiperExpense,
      totalBalance: number = totalIncomeAmount - totalExpenseAmount,
      bankBalance: number =
        BankIncome - BankExpense + (SwiperIncome - SwiperExpense),
      cashBalance: number = CashIncome - CashExpense,
      tasdeedBalance: number = TasdeedIncome - TasdeedExpense;

    return Response.json(
      {
        expenseCount,
        incomeCount,
        totalIncomeAmount,
        totalExpenseAmount,
        totalBalance,
        bankBalance,
        cashBalance,
        tasdeedBalance,
        BankIncome,
        CashIncome,
        TasdeedIncome,
        SwiperIncome,
        BankExpense,
        CashExpense,
        TasdeedExpense,
        SwiperExpense,
        daysOfWeekInitials,
        expensesLast7DaysTotal,
        profitLast7DaysTotal,
        last12Months,
        monthNames,
        last12MonthsExpenses,
        last12MonthsProfit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching records:", error);
    return Response.json({ error: "Error fetching records" }, { status: 500 });
  }
}

function calculateLast7Days(
  expenseRecords: TRecordData[],
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

  return [expensesLast7DaysTotal, profitLast7DaysTotal];
}

function calculateLast12Months(
  currentDate: Date,
  currentYear: number
): { month: number; name: string; year: number }[] {
  return Array.from({ length: 12 }, (_, index) => {
    let month: number = currentDate.getMonth() - index;
    let year: number = currentYear;
    if (month < 0) {
      month += 12;
      year -= 1; // Adjust year for months before January
    }
    return {
      month: month + 1,
      name: new Date(year, month, 1).toLocaleString("en-US", {
        month: "short",
      }),
      year,
    };
  }).reverse();
}

async function calculateLast12MonthsTotals(
  expenseRecords: TRecordData[],
  last12Months: { month: number; name: string; year: number }[]
): Promise<[number[], number[]]> {
  const last12MonthsExpenses: number[] = Array.from({ length: 12 }, () => 0);
  const last12MonthsProfit: number[] = Array.from({ length: 12 }, () => 0);

  await Promise.all(
    last12Months.map(async ({ month, year }, index) => {
      const expensesTotal: number = expenseRecords
        .filter(
          (record) =>
            new Date(record.createdAt).getMonth() === month &&
            new Date(record.createdAt).getFullYear() === year
        )
        .reduce(
          (total, record) => total + (record.amount || 0), // Assuming 'amount' is the correct field for expenses
          0
        );
      last12MonthsExpenses[index] = expensesTotal;

      // Assuming there's a service fee field in the record
      const profitTotal: number = expenseRecords
        .filter(
          (record) =>
            new Date(record.createdAt).getMonth() === month &&
            new Date(record.createdAt).getFullYear() === year
        )
        .reduce((total, record) => total + (record.serviceFee || 0), 0);
      last12MonthsProfit[index] = profitTotal;
    })
  );

  return [last12MonthsExpenses, last12MonthsProfit];
}
