import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import Records from "@/models/records";
import { filterData } from "@/utils/filterData";
import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";

type TMethodAggregateRow = {
  _id: {
    type: "income" | "expense";
    method: string;
  };
  total: number;
  count: number;
  serviceFeeTotal: number;
  zaadExpenseTotal: number;
};

export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const filter = filterData(searchParams, true);
    const aggregate = (await Records.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            type: "$type",
            method: "$method",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          serviceFeeTotal: {
            $sum: {
              $cond: [
                { $eq: ["$type", "expense"] },
                { $ifNull: ["$serviceFee", 0] },
                0,
              ],
            },
          },
          zaadExpenseTotal: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$type", "expense"] },
                    { $eq: ["$self", "zaad"] },
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
        },
      },
    ])) as TMethodAggregateRow[];

    const summary: Record<string, Record<string, number>> = {
      income: {},
      expense: {},
    };

    let incomeCount = 0;
    let expenseCount = 0;
    let profit = 0;
    let zaadExpenseTotal = 0;

    for (const row of aggregate) {
      const type = row?._id?.type;
      const method = row?._id?.method || "unknown";
      if (!type) continue;

      if (!summary[type]) {
        summary[type] = {};
      }
      summary[type][method] = row.total || 0;

      if (type === "income") {
        incomeCount += row.count || 0;
      }
      if (type === "expense") {
        expenseCount += row.count || 0;
        profit += row.serviceFeeTotal || 0;
        zaadExpenseTotal += row.zaadExpenseTotal || 0;
      }
    }

    const getMethodTotal = (type: "income" | "expense", method: string) =>
      summary[type]?.[method] || 0;

    const BankIncome = getMethodTotal("income", "bank");
    const CashIncome = getMethodTotal("income", "cash");
    const TasdeedIncome = getMethodTotal("income", "tasdeed");
    const SwiperIncome = getMethodTotal("income", "swiper");

    const BankExpense = getMethodTotal("expense", "bank");
    const CashExpense = getMethodTotal("expense", "cash");
    const TasdeedExpense = getMethodTotal("expense", "tasdeed");
    const SwiperExpense = getMethodTotal("expense", "swiper");

    const roundedZaadExpenseTotal = parseFloat(
      (zaadExpenseTotal || 0).toFixed(2),
    );

    const grossProfit = parseFloat(profit.toFixed(2));
    const profitAfterOfficeExpenses = parseFloat(
      (grossProfit - roundedZaadExpenseTotal).toFixed(2),
    );

    const totalIncomeAmount: number =
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
        summary,
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
        profit: grossProfit,
        grossProfit,
        zaadExpenseTotal: roundedZaadExpenseTotal,
        profitAfterOfficeExpenses,
        netProfit: profitAfterOfficeExpenses,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching records:", error);
    return Response.json({ error: "Error fetching records" }, { status: 500 });
  }
}
