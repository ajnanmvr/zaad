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
    const [aggregate, paymentTemplates, detailedRecords] = await Promise.all([
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
      Records.find(filter)
        .select("amount type status createdAt company employee self")
        .populate("company", "name")
        .populate("employee", "name")
        .lean(),
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

    const dailyMap = new Map<string, { income: number; expense: number }>();
    const monthlyMap = new Map<string, { income: number; expense: number }>();
    const statusMap = new Map<string, { income: number; expense: number; total: number }>();
    const entityMap = new Map<
      string,
      {
        label: string;
        entityType: "company" | "employee" | "self" | "unknown";
        income: number;
        expense: number;
        volume: number;
      }
    >();

    for (const record of detailedRecords as any[]) {
      const amount = Number(record?.amount || 0);
      const type = record?.type === "income" ? "income" : "expense";
      const createdAt = record?.createdAt ? new Date(record.createdAt) : null;

      if (createdAt && !Number.isNaN(createdAt.getTime())) {
        const dayKey = createdAt.toISOString().slice(0, 10);
        const monthKey = `${createdAt.getUTCFullYear()}-${String(createdAt.getUTCMonth() + 1).padStart(2, "0")}`;

        const dayBucket = dailyMap.get(dayKey) || { income: 0, expense: 0 };
        dayBucket[type] += amount;
        dailyMap.set(dayKey, dayBucket);

        const monthBucket = monthlyMap.get(monthKey) || { income: 0, expense: 0 };
        monthBucket[type] += amount;
        monthlyMap.set(monthKey, monthBucket);
      }

      const normalizedStatus = String(record?.status || "unknown").trim().toLowerCase() || "unknown";
      const statusBucket = statusMap.get(normalizedStatus) || {
        income: 0,
        expense: 0,
        total: 0,
      };
      statusBucket[type] += amount;
      statusBucket.total += amount;
      statusMap.set(normalizedStatus, statusBucket);

      let entityKey = "unknown";
      let entityLabel = "Unknown";
      let entityType: "company" | "employee" | "self" | "unknown" = "unknown";

      if (record?.company?._id) {
        entityKey = `company:${String(record.company._id)}`;
        entityLabel = String(record.company.name || "Unknown Company");
        entityType = "company";
      } else if (record?.employee?._id) {
        entityKey = `employee:${String(record.employee._id)}`;
        entityLabel = String(record.employee.name || "Unknown Employee");
        entityType = "employee";
      } else if (record?.self) {
        entityKey = `self:${String(record.self)}`;
        entityLabel = String(record.self || "Self").toUpperCase();
        entityType = "self";
      }

      const entityBucket = entityMap.get(entityKey) || {
        label: entityLabel,
        entityType,
        income: 0,
        expense: 0,
        volume: 0,
      };

      entityBucket[type] += amount;
      entityBucket.volume += amount;
      entityMap.set(entityKey, entityBucket);
    }

    const dailyTrend = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, bucket]) => ({
        date,
        income: parseFloat(bucket.income.toFixed(2)),
        expense: parseFloat(bucket.expense.toFixed(2)),
      }));

    const monthlyTrend = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, bucket]) => ({
        month,
        income: parseFloat(bucket.income.toFixed(2)),
        expense: parseFloat(bucket.expense.toFixed(2)),
      }));

    const statusBreakdown = Array.from(statusMap.entries())
      .map(([status, bucket]) => ({
        status,
        income: parseFloat(bucket.income.toFixed(2)),
        expense: parseFloat(bucket.expense.toFixed(2)),
        total: parseFloat(bucket.total.toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const topEntities = Array.from(entityMap.entries())
      .map(([key, bucket]) => ({
        key,
        label: bucket.label,
        entityType: bucket.entityType,
        income: parseFloat(bucket.income.toFixed(2)),
        expense: parseFloat(bucket.expense.toFixed(2)),
        balance: parseFloat((bucket.income - bucket.expense).toFixed(2)),
        volume: parseFloat(bucket.volume.toFixed(2)),
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

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
        dailyTrend,
        monthlyTrend,
        statusBreakdown,
        topEntities,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching records:", error);
    return Response.json({ error: "Error fetching records" }, { status: 500 });
  }
}
