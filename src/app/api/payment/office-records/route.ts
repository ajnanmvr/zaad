import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import Records from "@/models/records";
import { PAYMENT_POPULATE_FIELDS, mapRecordListItem } from "@/app/api/payment/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(Number(searchParams.get("page") || "0"), 0);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || "20"), 1), 100);
    const search = String(searchParams.get("search") || "").trim();

    const query: Record<string, any> = {
      recordKind: "office_records",
      deletedAt: null,
    };

    if (search) {
      query.$or = [
        { particular: { $regex: search, $options: "i" } },
        { remarks: { $regex: search, $options: "i" } },
      ];
    }

    const [records, total, groupedRows] = await Promise.all([
      Records.find(query)
        .populate(PAYMENT_POPULATE_FIELDS)
        .sort({ createdAt: -1 })
        .skip(page * limit)
        .limit(limit)
        .lean(),
      Records.countDocuments(query),
      Records.aggregate([
        {
          $match: {
            recordKind: "office_records",
            deletedAt: null,
          },
        },
        {
          $lookup: {
            from: "officeExpenseCategories",
            localField: "category",
            foreignField: "_id",
            as: "categoryRef",
          },
        },
        {
          $unwind: {
            path: "$categoryRef",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            type: 1,
            categoryName: { $ifNull: ["$categoryRef.category", "Office"] },
            effectiveAmount: {
              $cond: [
                { $eq: ["$type", "expense"] },
                { $add: ["$amount", { $ifNull: ["$serviceFee", 0] }] },
                "$amount",
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              type: "$type",
              categoryName: "$categoryName",
            },
            total: { $sum: "$effectiveAmount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const incomeByCategory = groupedRows
      .filter((row: any) => row?._id?.type === "income")
      .map((row: any) => ({
        category: row._id.categoryName,
        total: Number((row.total || 0).toFixed(2)),
        count: row.count || 0,
      }))
      .sort((a: any, b: any) => b.total - a.total);

    const expenseByCategory = groupedRows
      .filter((row: any) => row?._id?.type === "expense")
      .map((row: any) => ({
        category: row._id.categoryName,
        total: Number((row.total || 0).toFixed(2)),
        count: row.count || 0,
      }))
      .sort((a: any, b: any) => b.total - a.total);

    return Response.json(
      {
        records: records.map(mapRecordListItem),
        summary: {
          incomeByCategory,
          expenseByCategory,
          totalIncome: Number(incomeByCategory.reduce((sum: number, row: any) => sum + row.total, 0).toFixed(2)),
          totalExpense: Number(expenseByCategory.reduce((sum: number, row: any) => sum + row.total, 0).toFixed(2)),
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
    return Response.json(
      { error: error?.message || "Failed to load office records" },
      { status: 500 },
    );
  }
}
