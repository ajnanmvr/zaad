import connect from "@/db/mongo";
import Entity from "@/models/entities";
import Records from "@/models/records";
import { NextRequest } from "next/server";
import { filterData } from "@/utils/filterData";
import { requirePermission } from "@/auth/guards";

export const dynamic = "force-dynamic";

type BalanceEntity = {
  _id?: string;
  name: string;
  entityType?: "company" | "employee" | "individual";
};

type BalanceRecord = {
  company?: { toString: () => string } | string;
  employee?: { toString: () => string } | string;
  type: string;
  amount: number;
  serviceFee?: number;
  published?: boolean;
};

function buildRecordsByKey(
  records: BalanceRecord[],
  key: "company" | "employee"
) {
  const map = new Map<string, BalanceRecord[]>();
  for (const record of records) {
    const value = record[key];
    if (!value) continue;
    const id = value.toString();
    const existing = map.get(id) || [];
    existing.push(record);
    map.set(id, existing);
  }
  return map;
}

function aggregateEntityBalances(
  entities: BalanceEntity[],
  recordsByEntityId: Map<string, BalanceRecord[]>
) {
  const over0balance: Array<{
    id?: string;
    name: string;
    balance: number;
    serviceFee: number;
  }> = [];
  const under0balance: Array<{
    id?: string;
    name: string;
    balance: number;
    serviceFee?: number;
  }> = [];

  let totalProfitAll = 0;
  let totalToGive = 0;
  let totalToGet = 0;

  for (const entity of entities) {
    const entityId = entity._id?.toString();
    if (!entityId) continue;

    const entityRecords = recordsByEntityId.get(entityId) || [];
    let incomeTotal = 0;
    let expenseTotal = 0;
    let serviceFee = 0;

    for (const record of entityRecords) {
      if (record.type === "income") {
        incomeTotal += record.amount;
      }
      if (record.type === "expense") {
        const fee = record.serviceFee ?? 0;
        expenseTotal += record.amount + fee;
        serviceFee += fee;
      }
    }

    const balance = incomeTotal - expenseTotal;
    if (balance > 0) {
      over0balance.push({
        id: entity._id,
        name: entity.name,
        balance,
        serviceFee,
      });
      totalProfitAll += serviceFee;
      totalToGive += balance;
    } else if (balance < 0) {
      under0balance.push({
        id: entity._id,
        name: entity.name,
        balance,
        serviceFee,
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
    const [entities, allRecords]: [BalanceEntity[], BalanceRecord[]] = await Promise.all([
      Entity.find({ published: true }).select("_id name entityType"),
      Records.find(filter),
    ]);

    const companies = entities.filter((entity) => entity.entityType === "company");
    const employees = entities.filter((entity) => entity.entityType === "employee");
    const individuals = entities.filter((entity) => entity.entityType === "individual");

    const companyRecords = allRecords.filter(
      (record) => record.company && record.published
    );
    const employeeRecords = allRecords.filter(
      (record) => record.employee && record.published
    );

    const companyRecordsById = buildRecordsByKey(companyRecords, "company");
    const employeeRecordsById = buildRecordsByKey(employeeRecords, "employee");

    const {
      over0balance: over0balanceCompanies,
      under0balance: under0balanceCompanies,
      totalProfitAll: totalProfitAllCompanies,
      totalToGive: totalToGiveCompanies,
      totalToGet: totalToGetCompanies,
    } = aggregateEntityBalances(companies, companyRecordsById);

    const {
      over0balance: over0balanceEmployees,
      under0balance: under0balanceEmployees,
      totalProfitAll: totalProfitAllEmployees,
      totalToGive: totalToGiveEmployees,
      totalToGet: totalToGetEmployees,
    } = aggregateEntityBalances(employees, employeeRecordsById);

    const {
      over0balance: over0balanceIndividuals,
      under0balance: under0balanceIndividuals,
      totalProfitAll: totalProfitAllIndividuals,
      totalToGive: totalToGiveIndividuals,
      totalToGet: totalToGetIndividuals,
    } = aggregateEntityBalances(individuals, employeeRecordsById);

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
