import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import Records from "@/models/records";
import { PAYMENT_POPULATE_FIELDS, mapRecordListItem } from "@/app/api/payment/utils";
import { findAllMonthlyFinanceStats } from "@/repositories/paymentRepository";

type CategoryBucket = {
  incomeTotal: number;
  incomeCount: number;
  expenseTotal: number;
  expenseCount: number;
};

type MonthlyOfficeStatsRow = {
  year: number;
  month: number;
  totalTransactions: number;
  officeRecords?: {
    totalIncome?: number;
    totalExpense?: number;
    byCategory?: Array<{
      categoryId: string;
      categoryLabel: string;
      income: number;
      expense: number;
      balance: number;
    }>;
  };
};

export const dynamic = "force-dynamic";

function getMonthRange(month?: string | null, year?: string | null) {
  const now = new Date();
  const monthNum = month ? Number(month) : now.getMonth() + 1;
  const yearNum = year ? Number(year) : now.getFullYear();
  const monthStart = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(yearNum, monthNum, 1, 0, 0, 0, 0);
  return { monthStart, monthEnd, monthNum, yearNum };
}

function aggregateMonthlyStats(monthlyStats: MonthlyOfficeStatsRow[], searchParams: URLSearchParams) {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const month = searchParams.get("month");
  const year = searchParams.get("y");

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const selectedStats = monthlyStats.filter((row) => {
    const rowDate = new Date(row.year, row.month - 1, 1);

    if (from || to) {
      const fromDate = from ? new Date(from) : new Date(1900, 0, 1);
      const toDate = to ? new Date(to) : new Date(2999, 11, 31);
      return (
        rowDate >= new Date(fromDate.getFullYear(), fromDate.getMonth(), 1) &&
        rowDate <= new Date(toDate.getFullYear(), toDate.getMonth(), 1)
      );
    }

    if (month || year) {
      const { monthNum, yearNum } = getMonthRange(month, year);
      return row.year === yearNum && row.month === monthNum;
    }

    return true;
  });

  const categoryMap = new Map<
    string,
    { category: string; income: number; expense: number; incomeCount: number; expenseCount: number }
  >();

  let totalIncome = 0;
  let totalExpense = 0;
  let allTimeCount = 0;

  for (const stat of selectedStats) {
    totalIncome += Number(stat.officeRecords?.totalIncome || 0);
    totalExpense += Number(stat.officeRecords?.totalExpense || 0);
    allTimeCount += Number(stat.totalTransactions || 0);

    for (const category of stat.officeRecords?.byCategory || []) {
      const key = String(category.categoryLabel || category.categoryId || "Office");
      const existing = categoryMap.get(key) || {
        category: key,
        income: 0,
        expense: 0,
        incomeCount: 0,
        expenseCount: 0,
      };

      existing.income += Number(category.income || 0);
      existing.expense += Number(category.expense || 0);
      existing.incomeCount += Number((category.income || 0) > 0 ? 1 : 0);
      existing.expenseCount += Number((category.expense || 0) > 0 ? 1 : 0);
      categoryMap.set(key, existing);
    }
  }

  const incomeByCategory = Array.from(categoryMap.values())
    .filter((bucket) => bucket.incomeCount > 0)
    .map((bucket) => ({
      category: bucket.category,
      total: Number(bucket.income.toFixed(2)),
      count: bucket.incomeCount,
    }))
    .sort((a, b) => b.total - a.total);

  const expenseByCategory = Array.from(categoryMap.values())
    .filter((bucket) => bucket.expenseCount > 0)
    .map((bucket) => ({
      category: bucket.category,
      total: Number(bucket.expense.toFixed(2)),
      count: bucket.expenseCount,
    }))
    .sort((a, b) => b.total - a.total);

  const currentMonthStats = monthlyStats.find((row) => row.year === currentYear && row.month === currentMonth);

  return {
    records: [],
    summary: {
      incomeByCategory,
      expenseByCategory,
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
    },
    report: {
      allTimeCount,
      thisMonthCount: Number(currentMonthStats?.totalTransactions || 0),
      thisMonthIncome: Number((currentMonthStats?.officeRecords?.totalIncome || 0).toFixed(2)),
      thisMonthExpense: Number((currentMonthStats?.officeRecords?.totalExpense || 0).toFixed(2)),
    },
    pagination: {
      page: 0,
      limit: selectedStats.length,
      total: selectedStats.length,
      totalPages: 1,
      hasMore: false,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(Number(searchParams.get("page") || "0"), 0);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || "20"), 1), 100);
    const search = String(searchParams.get("search") || "").trim();
    const type = String(searchParams.get("type") || "").trim().toLowerCase();
    const method = String(searchParams.get("method") || "").trim().toLowerCase();
    const sort = String(searchParams.get("sort") || "newest").trim().toLowerCase();
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const month = searchParams.get("month");
    const year = searchParams.get("y");

    const hasUnsupportedRecordFilters = Boolean(search || type || method);

    if (!hasUnsupportedRecordFilters) {
      const monthlyStatsRaw = await findAllMonthlyFinanceStats(true);
      const monthlyStats: MonthlyOfficeStatsRow[] = Array.isArray(monthlyStatsRaw)
        ? monthlyStatsRaw.map((row: any) => ({
            year: Number(row?.year || 0),
            month: Number(row?.month || 0),
            totalTransactions: Number(row?.totalTransactions || 0),
            officeRecords: {
              totalIncome: Number(row?.officeRecords?.totalIncome || 0),
              totalExpense: Number(row?.officeRecords?.totalExpense || 0),
              byCategory: Array.isArray(row?.officeRecords?.byCategory)
                ? row.officeRecords.byCategory.map((category: any) => ({
                    categoryId: String(category?.categoryId || ""),
                    categoryLabel: String(category?.categoryLabel || "Office"),
                    income: Number(category?.income || 0),
                    expense: Number(category?.expense || 0),
                    balance: Number(category?.balance || 0),
                  }))
                : [],
            },
          }))
        : [];
      return Response.json(aggregateMonthlyStats(monthlyStats, searchParams), { status: 200 });
    }

    const query: Record<string, any> = {
      recordKind: "office_records",
      deletedAt: null,
    };

    if (from || to) {
      const dateQuery: Record<string, any> = {};
      if (from) {
        dateQuery.$gte = new Date(from);
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateQuery.$lte = toDate;
      }
      query.createdAt = dateQuery;
    } else if (month || year) {
      const { monthStart, monthEnd } = getMonthRange(month, year);
      query.createdAt = {
        $gte: monthStart,
        $lt: monthEnd,
      };
    }

    if (search) {
      query.$or = [
        { particular: { $regex: search, $options: "i" } },
        { remarks: { $regex: search, $options: "i" } },
      ];
    }

    const baseRecords = await Records.find(query)
      .populate(PAYMENT_POPULATE_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    const mappedRows = baseRecords.map(mapRecordListItem);

    const filteredRows = mappedRows.filter((row: any) => {
      const typeMatch = !type || row.type === type;
      const methodMatch = !method || String(row.method || "").toLowerCase() === method;
      const searchMatch =
        !search ||
        [
          `${row.suffix || ""}${row.number || ""}`,
          row.particular || "",
          row.categoryName || "",
          row.method || "",
          row.remarks || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());

      return typeMatch && methodMatch && searchMatch;
    });

    const sortedRows = [...filteredRows].sort((a: any, b: any) => {
      if (sort === "amount-desc") return Number(b.amount || 0) - Number(a.amount || 0);
      if (sort === "amount-asc") return Number(a.amount || 0) - Number(b.amount || 0);
      if (sort === "particular-asc") return String(a.particular || "").localeCompare(String(b.particular || ""));
      if (sort === "particular-desc") return String(b.particular || "").localeCompare(String(a.particular || ""));
      if (sort === "oldest") {
        return new Date(String(a.createdAt || 0)).getTime() - new Date(String(b.createdAt || 0)).getTime();
      }
      return new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime();
    });

    const total = sortedRows.length;
    const pagedRows = sortedRows.slice(page * limit, page * limit + limit);

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const thisMonthRows = filteredRows.filter((row: any) => {
      const createdAt = new Date(String(row.createdAt || 0));
      if (Number.isNaN(createdAt.getTime())) return false;
      return createdAt >= thisMonthStart;
    });

    const groupedByCategory = filteredRows.reduce(
      (acc: Record<string, CategoryBucket>, row: any) => {
        const categoryKey = String(row.categoryName || "Office");
        if (!acc[categoryKey]) {
          acc[categoryKey] = {
            incomeTotal: 0,
            incomeCount: 0,
            expenseTotal: 0,
            expenseCount: 0,
          };
        }
        const amount = Number(row.amount || 0);
        const serviceFee = Number(row.serviceFee || 0);
        if (row.type === "income") {
          acc[categoryKey].incomeTotal += amount;
          acc[categoryKey].incomeCount += 1;
        } else {
          acc[categoryKey].expenseTotal += amount + serviceFee;
          acc[categoryKey].expenseCount += 1;
        }
        return acc;
      },
      {},
    );

    const categoryEntries = Object.entries(groupedByCategory) as Array<[string, CategoryBucket]>;

    const incomeByCategory = categoryEntries
      .filter(([, bucket]) => bucket.incomeCount > 0)
      .map(([category, bucket]) => ({
        category,
        total: Number(bucket.incomeTotal.toFixed(2)),
        count: bucket.incomeCount,
      }))
      .sort((a, b) => b.total - a.total);

    const expenseByCategory = categoryEntries
      .filter(([, bucket]) => bucket.expenseCount > 0)
      .map(([category, bucket]) => ({
        category,
        total: Number(bucket.expenseTotal.toFixed(2)),
        count: bucket.expenseCount,
      }))
      .sort((a, b) => b.total - a.total);

    const totalIncome = Number(incomeByCategory.reduce((sum: number, row: any) => sum + row.total, 0).toFixed(2));
    const totalExpense = Number(expenseByCategory.reduce((sum: number, row: any) => sum + row.total, 0).toFixed(2));

    return Response.json(
      {
        records: pagedRows,
        summary: {
          incomeByCategory,
          expenseByCategory,
          totalIncome,
          totalExpense,
        },
        report: {
          allTimeCount: filteredRows.length,
          thisMonthCount: thisMonthRows.length,
          thisMonthIncome: Number(
            thisMonthRows
              .filter((row: any) => row.type === "income")
              .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0)
              .toFixed(2),
          ),
          thisMonthExpense: Number(
            thisMonthRows
              .filter((row: any) => row.type !== "income")
              .reduce((sum: number, row: any) => sum + Number(row.amount || 0) + Number(row.serviceFee || 0), 0)
              .toFixed(2),
          ),
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: (page + 1) * limit < total,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    const errorStatus = getServiceErrorStatus(error);
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to load office records") },
      { status: errorStatus },
    );
  }
}