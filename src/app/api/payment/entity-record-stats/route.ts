import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import EntityRecordStats from "@/models/entityRecordStats";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type EntityRecordStatRow = {
  entity: string;
  entityType: "company" | "employee" | "individual" | string;
  entityName: string;
  entityColor?: string;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalServiceFee: number;
  totalTransactions: number;
  lastRecomputedAt?: string;
};

function formatRows(rows: EntityRecordStatRow[]) {
  const creditRows = rows
    .filter((row) => row.balance >= 0)
    .sort((a, b) => b.balance - a.balance);

  const debitRows = rows
    .filter((row) => row.balance < 0)
    .sort((a, b) => a.balance - b.balance);

  return { creditRows, debitRows };
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const rows = await EntityRecordStats.aggregate<EntityRecordStatRow>([
      {
        $match: {
          published: true,
        },
      },
      {
        $lookup: {
          from: "entities",
          localField: "entity",
          foreignField: "_id",
          as: "entityDoc",
        },
      },
      {
        $unwind: {
          path: "$entityDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          entityName: {
            $ifNull: ["$entityDoc.name", "Unknown Entity"],
          },
          entityType: {
            $ifNull: ["$entityType", "$entityDoc.entityType"],
          },
          entityColor: {
            $ifNull: ["$entityDoc.color", "#3C50E0"],
          },
        },
      },
      {
        $project: {
          entity: { $toString: "$entity" },
          entityType: 1,
          entityName: 1,
          entityColor: 1,
          balance: 1,
          totalIncome: 1,
          totalExpense: 1,
          totalServiceFee: 1,
          totalTransactions: 1,
          lastRecomputedAt: 1,
        },
      },
      {
        $sort: {
          balance: -1,
        },
      },
    ]);

    const { creditRows, debitRows } = formatRows(rows || []);

    return Response.json(
      {
        summary: {
          creditRows,
          debitRows,
          totals: {
            creditCount: creditRows.length,
            debitCount: debitRows.length,
            totalCount: rows.length,
            creditBalance: Number(
              creditRows.reduce((sum, row) => sum + Number(row.balance || 0), 0).toFixed(2),
            ),
            debitBalance: Number(
              debitRows.reduce((sum, row) => sum + Math.abs(Number(row.balance || 0)), 0).toFixed(2),
            ),
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const status = getServiceErrorStatus(error);
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to load entity record stats") },
      { status },
    );
  }
}
