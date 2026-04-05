import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import Records from "@/models/records";
import { NextRequest } from "next/server";
import { mapRecordListItem, PAYMENT_POPULATE_FIELDS } from "../utils";

type SelfDepositTransfer = {
  id: string;
  expense?: ReturnType<typeof mapRecordListItem>;
  income?: ReturnType<typeof mapRecordListItem>;
};

function canPairRecords(expense: any, income: any) {
  if (!expense || !income) return false;

  return (
    expense.status === "Self Deposit" &&
    income.status === "Self Deposit" &&
    expense.type === "expense" &&
    income.type === "income" &&
    expense.amount === income.amount &&
    String(expense.suffix || "") === String(income.suffix || "") &&
    String(expense.createdBy || "") === String(income.createdBy || "")
  );
}

function buildTransfers(records: any[]): SelfDepositTransfer[] {
  const transfers: SelfDepositTransfer[] = [];

  for (let index = 0; index < records.length; index += 1) {
    const current = records[index];
    const next = records[index + 1];

    if (current?.type === "income" && next?.type === "expense" && canPairRecords(next, current)) {
      transfers.push({
        id: `${next._id}-${current._id}`,
        expense: mapRecordListItem(next),
        income: mapRecordListItem(current),
      });
      index += 1;
      continue;
    }

    if (current?.type === "expense" && next?.type === "income" && canPairRecords(current, next)) {
      transfers.push({
        id: `${current._id}-${next._id}`,
        expense: mapRecordListItem(current),
        income: mapRecordListItem(next),
      });
      index += 1;
      continue;
    }

    transfers.push({
      id: String(current?._id || index),
      expense: current?.type === "expense" ? mapRecordListItem(current) : undefined,
      income: current?.type === "income" ? mapRecordListItem(current) : undefined,
    });
  }

  return transfers;
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const searchParams = request.nextUrl.searchParams;
    const pageNumber = Number(searchParams.get("page") || 0);
    const type = searchParams.get("t");
    const method = searchParams.get("m");
    const contentPerSection = 10;

    const query: Record<string, any> = {
      published: true,
      status: "Self Deposit",
    };

    if (type) {
      query.type = type;
    }

    if (method) {
      query.method = method;
    }

    const records = await Records.find(query)
      .populate(PAYMENT_POPULATE_FIELDS)
      .sort({ createdAt: -1 });

    if (!records || records.length === 0) {
      return Response.json(
        {
          message: "No self deposit records found",
          count: 0,
          hasMore: false,
          records: [],
          balance: 0,
          totalIncome: 0,
          totalExpense: 0,
          totalTransactions: 0,
        },
        { status: 200 }
      );
    }

    const groupedTransfers = buildTransfers(records);
    const start = pageNumber * contentPerSection;
    const transformedData = groupedTransfers.slice(start, start + contentPerSection);
    const hasMore = groupedTransfers.length > start + contentPerSection;

    const allRecords = await Records.find(query);

    const totalIncome = allRecords.reduce(
      (acc, record) => acc + (record.type === "income" ? record.amount : 0),
      0
    );

    const totalExpense = allRecords.reduce(
      (acc, record) =>
        acc +
        (record.type === "expense" ? record.amount : 0) +
        (record.serviceFee || 0),
      0
    );

    const balance = totalIncome - totalExpense;
    const totalTransactions = groupedTransfers.length;

    return Response.json(
      {
        count: transformedData.length,
        hasMore,
        records: transformedData,
        balance,
        totalIncome,
        totalExpense,
        totalTransactions,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error: "An unexpected error occurred", details: error },
      { status: 500 }
    );
  }
}
