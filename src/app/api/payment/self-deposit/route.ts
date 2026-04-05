import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import Records from "@/models/records";
import { NextRequest } from "next/server";
import { mapRecordListItem, PAYMENT_POPULATE_FIELDS } from "../utils";

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
      .skip(pageNumber * contentPerSection)
      .limit(contentPerSection + 1)
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

    const hasMore = records.length > contentPerSection;
    const transformedData = records.slice(0, contentPerSection).map(mapRecordListItem);

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
    const totalTransactions = allRecords.length;

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
