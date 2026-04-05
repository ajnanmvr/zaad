import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import Records from "@/models/records";
import PaymentTemplate from "@/models/paymentTemplates";
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
    const [aggregate, paymentTemplates] = await Promise.all([
      Records.aggregate([
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
      ]),
      PaymentTemplate.find({}).select("method").sort({ method: 1 }),
    ]);

    const typedAggregate = aggregate as TMethodAggregateRow[];

    const summary: Record<string, Record<string, number>> = {
      income: {},
      expense: {},
    };

    let incomeCount = 0;
    let expenseCount = 0;
    let profit = 0;
    let zaadExpenseTotal = 0;

    for (const row of typedAggregate) {
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

    const methodsFromSummary = Array.from(new Set([
      ...Object.keys(summary.income || {}),
      ...Object.keys(summary.expense || {}),
    ]));
    const methodsFromTemplates = paymentTemplates.map((item: any) => item.method).filter(Boolean);
    const extraMethods = methodsFromSummary
      .filter((method) => !methodsFromTemplates.includes(method))
      .sort((a, b) => a.localeCompare(b));
    const allMethods = methodsFromTemplates.concat(extraMethods);

    const methodBreakdown = allMethods.map((method) => {
      const income = summary.income?.[method] || 0;
      const expense = summary.expense?.[method] || 0;
      return {
        method,
        income,
        expense,
        balance: income - expense,
      };
    });

    const methodBalances = methodBreakdown.reduce<Record<string, number>>((acc, row) => {
      acc[row.method] = row.balance;
      return acc;
    }, {});

    const roundedZaadExpenseTotal = parseFloat(
      (zaadExpenseTotal || 0).toFixed(2),
    );

    const grossProfit = parseFloat(profit.toFixed(2));
    const profitAfterOfficeExpenses = parseFloat(
      (grossProfit - roundedZaadExpenseTotal).toFixed(2),
    );

    const totalIncomeAmount: number = Object.values(summary.income || {}).reduce((sum, value) => sum + (value || 0), 0);
    const totalExpenseAmount: number = Object.values(summary.expense || {}).reduce((sum, value) => sum + (value || 0), 0);
    const totalBalance: number = totalIncomeAmount - totalExpenseAmount;

    return Response.json(
      {
        expenseCount,
        incomeCount,
        summary,
        methodBreakdown,
        methodBalances,
        totalIncomeAmount,
        totalExpenseAmount,
        totalBalance,
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
