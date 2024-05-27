import connect from "@/db/connect";
import calculateLast12Months from "@/helpers/calculateLast12Months";
import calculateLast12MonthsTotals from "@/helpers/calculateLast12MonthsTotals";
import calculateLast7Days from "@/helpers/calculateLast7Days";
import Records from "@/models/records"; // Assuming TRecordDataWithCreatedAt is the correct type for your Records model
import { TRecordDataWithCreatedAt } from "@/types/records";
connect();
export const dynamic = 'force-dynamic'
export async function GET(): Promise<Response> {
  try {
    const allRecords: TRecordDataWithCreatedAt[] = await Records.find({
      published: true,
    });
    const expenseRecords: TRecordDataWithCreatedAt[] = allRecords.filter(
      (record) => record.type === "expense"
    );
    const incomeRecords: TRecordDataWithCreatedAt[] = allRecords.filter(
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
