import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import Records from "@/models/records";
import { NextRequest } from "next/server";
import { mapRecordListItem, PAYMENT_POPULATE_FIELDS } from "../../utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const records = await Records.find({
      published: true,
      employee: params.id,
    })
      .populate(PAYMENT_POPULATE_FIELDS)
      .sort({ createdAt: -1 });

    if (!records || records.length === 0) {
      return Response.json(
        {
          message: "No records found",
          count: 0,
          records: [],
          balance: 0,
          totalIncome: 0,
          totalExpense: 0,
          totalTransactions: 0,
        },
        { status: 200 }
      );
    }

    const transformedData = records
      .filter((record: any) => record?.employee?.entityType === "individual")
      .map(mapRecordListItem);

    const individualRecords = records.filter(
      (record: any) => record?.employee?.entityType === "individual"
    );

    const totalIncome = individualRecords.reduce(
      (acc, record) =>
        acc +
        (record.type === "income" && !String(record.status || "").toLowerCase().includes("liability")
          ? record.amount
          : 0),
      0
    );
    const totalExpense = individualRecords.reduce(
      (acc, record) =>
        acc +
        (record.type === "expense" ? record.amount : 0) +
        (record.serviceFee || 0),
      0
    );
    const balance = totalIncome - totalExpense;
    const totalTransactions = individualRecords.length;

    return Response.json(
      {
        count: transformedData.length,
        records: transformedData,
        balance,
        totalIncome,
        totalExpense,
        totalTransactions,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json({ error }, { status: 401 });
  }
}
