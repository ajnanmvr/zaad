import connect from "@/db/mongo";
import Entity from "@/models/entities";
import Records from "@/models/records";
import { NextRequest } from "next/server";
import { filterData } from "@/utils/filterData";
import { requirePermission } from "@/auth/guards";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";

type BalanceEntity = {
  _id: Types.ObjectId;
  name: string;
  entityType?: "company" | "employee" | "individual";
};

type AggregatedBalance = {
  _id: {
    entityId: Types.ObjectId;
    refKind: "company" | "employee";
  };
  incomeTotal: number;
  expenseTotal: number;
  serviceFee: number;
  balance: number;
  lastActivityAt?: Date;
};

function aggregateEntityBalances(
  rows: Array<{
    entityId: string;
    entityName: string;
    balance: number;
    serviceFee: number;
    lastActivityAt?: string | Date | null;
  }>
) {
  const over0balance: Array<{
    id?: string | Types.ObjectId;
    name: string;
    balance: number;
    serviceFee: number;
    lastActivityAt?: string | Date | null;
  }> = [];
  const under0balance: Array<{
    id?: string | Types.ObjectId;
    name: string;
    balance: number;
    serviceFee: number;
    lastActivityAt?: string | Date | null;
  }> = [];

  let totalProfitAll = 0;
  let totalToGive = 0;
  let totalToGet = 0;

  for (const row of rows) {
    const balance = row.balance;
    const serviceFee = row.serviceFee;
    if (balance > 0) {
      over0balance.push({
        id: row.entityId,
        name: row.entityName,
        balance,
        serviceFee,
        lastActivityAt: row.lastActivityAt,
      });
      totalProfitAll += serviceFee;
      totalToGive += balance;
    } else if (balance < 0) {
      under0balance.push({
        id: row.entityId,
        name: row.entityName,
        balance,
        serviceFee,
        lastActivityAt: row.lastActivityAt,
      });
      totalToGet += balance;
    }
  }

  over0balance.sort((a, b) => a.name.localeCompare(b.name));
  under0balance.sort((a, b) => a.name.localeCompare(b.name));

  return {
    over0balance,
    under0balance,
    totalProfitAll,
    totalToGive,
    totalToGet,
  };
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const searchParams = request.nextUrl.searchParams;
    const filter = filterData(searchParams, true);
    const groupedBalances = await Records.aggregate<AggregatedBalance>([
      { $match: filter },
      {
        $project: {
          type: 1,
          amount: { $ifNull: ["$amount", 0] },
          serviceFee: { $ifNull: ["$serviceFee", 0] },
          createdAt: 1,
          entityRef: { $ifNull: ["$company", "$employee"] },
          refKind: {
            $cond: [{ $ifNull: ["$company", false] }, "company", "employee"],
          },
        },
      },
      { $match: { entityRef: { $ne: null } } },
      {
        $group: {
          _id: { entityId: "$entityRef", refKind: "$refKind" },
          incomeTotal: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
          },
          expenseTotal: {
            $sum: {
              $cond: [
                { $eq: ["$type", "expense"] },
                { $add: ["$amount", "$serviceFee"] },
                0,
              ],
            },
          },
          serviceFee: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$serviceFee", 0] },
          },
          lastActivityAt: { $max: "$createdAt" },
        },
      },
      {
        $addFields: {
          balance: { $subtract: ["$incomeTotal", "$expenseTotal"] },
        },
      },
    ]);

    if (!groupedBalances.length) {
      return Response.json(
        {
          over0balanceCompanies: [],
          under0balanceCompanies: [],
          totalProfitAllCompanies: 0,
          totalToGiveCompanies: 0,
          totalToGetCompanies: 0,
          over0balanceEmployees: [],
          under0balanceEmployees: [],
          totalProfitAllEmployees: 0,
          totalToGiveEmployees: 0,
          totalToGetEmployees: 0,
          over0balanceIndividuals: [],
          under0balanceIndividuals: [],
          totalProfitAllIndividuals: 0,
          totalToGiveIndividuals: 0,
          totalToGetIndividuals: 0,
          profit: 0,
          totalToGive: 0,
          totalToGet: 0,
        },
        { status: 200 }
      );
    }

    const ids = groupedBalances.map((row) => row._id.entityId);
    const entities = await Entity.find({
      _id: { $in: ids },
      published: true,
      entityType: { $in: ["company", "employee", "individual"] },
    })
      .select("_id name entityType")
      .lean<BalanceEntity[]>();

    const entityById = new Map(entities.map((entity) => [entity._id.toString(), entity]));

    const companyRows: Array<{ entityId: string; entityName: string; balance: number; serviceFee: number }> = [];
    const employeeRows: Array<{ entityId: string; entityName: string; balance: number; serviceFee: number; lastActivityAt?: string | Date | null }> = [];
    const individualRows: Array<{ entityId: string; entityName: string; balance: number; serviceFee: number; lastActivityAt?: string | Date | null }> = [];

    for (const row of groupedBalances) {
      const entityId = row._id.entityId.toString();
      const entity = entityById.get(entityId);
      if (!entity) continue;

      const payload = {
        entityId,
        entityName: entity.name,
        balance: row.balance,
        serviceFee: row.serviceFee,
        lastActivityAt: row.lastActivityAt,
      };

      if (entity.entityType === "company") {
        companyRows.push(payload);
      } else if (entity.entityType === "employee") {
        employeeRows.push(payload);
      } else if (entity.entityType === "individual") {
        individualRows.push(payload);
      }
    }

    const {
      over0balance: over0balanceCompanies,
      under0balance: under0balanceCompanies,
      totalProfitAll: totalProfitAllCompanies,
      totalToGive: totalToGiveCompanies,
      totalToGet: totalToGetCompanies,
    } = aggregateEntityBalances(companyRows);

    const {
      over0balance: over0balanceEmployees,
      under0balance: under0balanceEmployees,
      totalProfitAll: totalProfitAllEmployees,
      totalToGive: totalToGiveEmployees,
      totalToGet: totalToGetEmployees,
    } = aggregateEntityBalances(employeeRows);

    const {
      over0balance: over0balanceIndividuals,
      under0balance: under0balanceIndividuals,
      totalProfitAll: totalProfitAllIndividuals,
      totalToGive: totalToGiveIndividuals,
      totalToGet: totalToGetIndividuals,
    } = aggregateEntityBalances(individualRows);

    const profit =
      totalProfitAllEmployees + totalProfitAllCompanies + totalProfitAllIndividuals;
    const totalToGive =
      totalToGiveCompanies + totalToGiveEmployees + totalToGiveIndividuals;
    const totalToGet = totalToGetCompanies + totalToGetEmployees + totalToGetIndividuals;

    return Response.json(
      {
        over0balanceCompanies,
        under0balanceCompanies,
        totalProfitAllCompanies,
        totalToGiveCompanies,
        totalToGetCompanies,
        over0balanceEmployees,
        under0balanceEmployees,
        totalProfitAllEmployees,
        totalToGiveEmployees,
        totalToGetEmployees,
        over0balanceIndividuals,
        under0balanceIndividuals,
        totalProfitAllIndividuals,
        totalToGiveIndividuals,
        totalToGetIndividuals,
        profit,
        totalToGive,
        totalToGet,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
