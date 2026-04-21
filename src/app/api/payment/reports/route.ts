import { NextRequest, NextResponse } from "next/server";
import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { aggregateRecords } from "@/repositories/paymentRepository";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export const dynamic = "force-dynamic";

function parseDateRange(from: string | null, to: string | null) {
  if (!from || !to) {
    return null;
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return null;
  }

  const rangeStart = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate(), 0, 0, 0, 0));
  const rangeEndExclusive = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate() + 1, 0, 0, 0, 0));

  if (rangeEndExclusive <= rangeStart) {
    return null;
  }

  return { rangeStart, rangeEndExclusive };
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.view.records-summary");

    const searchParams = request.nextUrl.searchParams;
    const parsedRange = parseDateRange(searchParams.get("from"), searchParams.get("to"));

    if (!parsedRange) {
      return NextResponse.json(
        { error: "Invalid date range. Please provide valid from/to dates." },
        { status: 400 },
      );
    }

    const dateMatch = {
      createdAt: {
        $gte: parsedRange.rangeStart,
        $lt: parsedRange.rangeEndExclusive,
      },
      deletedAt: null,
    };

    const totalsAgg = await aggregateRecords([
      { $match: dateMatch },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, { $ifNull: ["$amount", 0] }, 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, { $ifNull: ["$amount", 0] }, 0],
            },
          },
          totalServiceFee: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, { $ifNull: ["$serviceFee", 0] }, 0],
            },
          },
        },
      },
    ]);

    const paymentMethodsAgg = await aggregateRecords([
      { $match: dateMatch },
      {
        $group: {
          _id: "$method",
          income: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, { $ifNull: ["$amount", 0] }, 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, { $ifNull: ["$amount", 0] }, 0],
            },
          },
          transactions: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "paymentTemplates",
          localField: "_id",
          foreignField: "_id",
          as: "methodDoc",
        },
      },
      {
        $unwind: {
          path: "$methodDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          methodId: { $toString: "$_id" },
          methodLabel: { $ifNull: ["$methodDoc.method", "Unknown"] },
          methodColor: { $ifNull: ["$methodDoc.color", ""] },
          methodIcon: { $ifNull: ["$methodDoc.icon", "card"] },
          income: { $round: ["$income", 2] },
          expense: { $round: ["$expense", 2] },
          net: { $round: [{ $subtract: ["$income", "$expense"] }, 2] },
          transactions: 1,
        },
      },
      { $sort: { net: -1, income: -1 } },
    ]);

    const officeCategoryAgg = await aggregateRecords([
      {
        $match: {
          ...dateMatch,
          recordKind: "office_records",
        },
      },
      {
        $group: {
          _id: "$category",
          income: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, { $ifNull: ["$amount", 0] }, 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, { $ifNull: ["$amount", 0] }, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "officeExpenseCategories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDoc",
        },
      },
      {
        $unwind: {
          path: "$categoryDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          categoryId: { $toString: "$_id" },
          categoryLabel: { $ifNull: ["$categoryDoc.category", "Office"] },
          income: { $round: ["$income", 2] },
          expense: { $round: ["$expense", 2] },
          balance: { $round: [{ $subtract: ["$income", "$expense"] }, 2] },
        },
      },
      { $sort: { expense: -1, income: -1 } },
    ]);

    const totalsRow = totalsAgg[0] || {
      totalTransactions: 0,
      totalIncome: 0,
      totalExpense: 0,
      totalServiceFee: 0,
    };

    const totalIncome = Number(totalsRow.totalIncome || 0);
    const totalExpense = Number(totalsRow.totalExpense || 0);
    const totalServiceFee = Number(totalsRow.totalServiceFee || 0);

    return NextResponse.json({
      success: true,
      summary: {
        range: {
          from: searchParams.get("from"),
          to: searchParams.get("to"),
        },
        totals: {
          totalTransactions: Number(totalsRow.totalTransactions || 0),
          totalIncome: Number(totalIncome.toFixed(2)),
          totalExpense: Number(totalExpense.toFixed(2)),
          totalServiceFee: Number(totalServiceFee.toFixed(2)),
          net: Number((totalIncome - totalExpense).toFixed(2)),
          entityBalance: Number((totalIncome - (totalExpense + totalServiceFee)).toFixed(2)),
        },
        paymentMethods: paymentMethodsAgg,
        officeCategories: officeCategoryAgg,
      },
    });
  } catch (error: unknown) {
    const status = getServiceErrorStatus(error);
    const message = getServiceErrorMessage(error, "Failed to generate finance report");

    if (status >= 500) {
      console.error("Error generating finance report:", error);
    }

    return NextResponse.json({ error: message }, { status });
  }
}
