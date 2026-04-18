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
      recordKind: "liability",
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
            recordKind: "liability",
            deletedAt: null,
          },
        },
        {
          $lookup: {
            from: "entities",
            localField: "entity",
            foreignField: "_id",
            as: "entityRef",
          },
        },
        {
          $unwind: {
            path: "$entityRef",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            type: 1,
            amount: 1,
            entityName: { $ifNull: ["$entityRef.name", "Unknown Entity"] },
          },
        },
        {
          $group: {
            _id: "$entityName",
            income: {
              $sum: {
                $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
              },
            },
            expense: {
              $sum: {
                $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
              },
            },
          },
        },
      ]),
    ]);

    const entitySummary = groupedRows
      .map((row: any) => ({
        entity: row._id,
        income: Number((row.income || 0).toFixed(2)),
        expense: Number((row.expense || 0).toFixed(2)),
        net: Number(((row.income || 0) - (row.expense || 0)).toFixed(2)),
      }))
      .sort((a: any, b: any) => Math.abs(b.net) - Math.abs(a.net));

    const totals = entitySummary.reduce(
      (acc: any, row: any) => {
        acc.income += row.income;
        acc.expense += row.expense;
        acc.net += row.net;
        return acc;
      },
      { income: 0, expense: 0, net: 0 },
    );

    return Response.json(
      {
        records: records.map(mapRecordListItem),
        summary: {
          entities: entitySummary,
          totals: {
            income: Number(totals.income.toFixed(2)),
            expense: Number(totals.expense.toFixed(2)),
            net: Number(totals.net.toFixed(2)),
          },
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
      { error: error?.message || "Failed to load liability records" },
      { status: 500 },
    );
  }
}
