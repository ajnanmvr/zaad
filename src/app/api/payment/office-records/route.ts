import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import Records from "@/models/records";
import { PAYMENT_POPULATE_FIELDS, mapRecordListItem } from "@/app/api/payment/utils";
import { getOfficeRecordCategorySummaryFromStats } from "@/services/paymentService";

type CategoryBucket = {
  incomeTotal: number;
  incomeCount: number;
  expenseTotal: number;
  expenseCount: number;
};

export const dynamic = "force-dynamic";

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

    // Date range parameters
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const month = searchParams.get("month");
    const year = searchParams.get("y");

    const query: Record<string, any> = {
      recordKind: "office_records",
      deletedAt: null,
    };

    // Add date range filtering
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
      // Handle month/year filtering
      const now = new Date();
      const monthNum = month ? Number(month) : now.getMonth() + 1;
      const yearNum = year ? Number(year) : now.getFullYear();
      
      const monthStart = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(yearNum, monthNum, 1, 0, 0, 0, 0);
      
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

    // Use precomputed stats only for all-time view (no date filters)
    const canUsePrecomputedSummary =
      !search && !type && !method && !from && !to && !month && !year;

    let incomeByCategory: Array<{ category: string; total: number; count: number }> = [];
    let expenseByCategory: Array<{ category: string; total: number; count: number }> = [];
    let totalIncome = 0;
    let totalExpense = 0;

    if (canUsePrecomputedSummary) {
      const precomputedSummary = await getOfficeRecordCategorySummaryFromStats();
      incomeByCategory = precomputedSummary.incomeByCategory.map((row) => ({
        category: row.category,
        total: row.total,
        count: row.count,
      }));
      expenseByCategory = precomputedSummary.expenseByCategory.map((row) => ({
        category: row.category,
        total: row.total,
        count: row.count,
      }));
      totalIncome = precomputedSummary.totalIncome;
      totalExpense = precomputedSummary.totalExpense;
    } else {
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
            // Include both expense amount and service fee in total
            acc[categoryKey].expenseTotal += amount + serviceFee;
            acc[categoryKey].expenseCount += 1;
          }
          return acc;
        },
        {},
      );

      const categoryEntries = Object.entries(groupedByCategory) as Array<
        [string, CategoryBucket]
      >;

      incomeByCategory = categoryEntries
        .filter(([, bucket]) => bucket.incomeCount > 0)
        .map(([category, bucket]) => ({
          category,
          total: Number(bucket.incomeTotal.toFixed(2)),
          count: bucket.incomeCount,
        }))
        .sort((a, b) => b.total - a.total);

      expenseByCategory = categoryEntries
        .filter(([, bucket]) => bucket.expenseCount > 0)
        .map(([category, bucket]) => ({
          category,
          total: Number(bucket.expenseTotal.toFixed(2)),
          count: bucket.expenseCount,
        }))
        .sort((a, b) => b.total - a.total);

      totalIncome = Number(incomeByCategory.reduce((sum: number, row: any) => sum + row.total, 0).toFixed(2));
      totalExpense = Number(expenseByCategory.reduce((sum: number, row: any) => sum + row.total, 0).toFixed(2));
    }

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


