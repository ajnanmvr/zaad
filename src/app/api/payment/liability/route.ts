import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import Records from "@/models/records";
import { NextRequest, NextResponse } from "next/server";
import { getRecordClient, PAYMENT_POPULATE_FIELDS } from "../utils";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");
    const records = await Records.find({
      published: true,
      status: { $regex: /^liability$/i },
    })
      .populate(PAYMENT_POPULATE_FIELDS)
      .sort({ createdAt: -1 });

    if (!records || records.length === 0) {
      return NextResponse.json(
        {
          message: "No records found",
          count: 0,
          records: [],
          balance: 0,
          totalIncome: 0,
        },
        { status: 200 }
      );
    }

    interface Client {
      name: string;
      id: string;
      type: "company" | "employee" | "individual";
    }

    interface GroupedData {
      [key: string]: {
        client: Client;
        income: number;
        expense: number;
      };
    }

    const groupedData = records.reduce((acc: GroupedData, record: any) => {
      const client = getRecordClient(record) as Client | null;

      if (client) {
        const clientId = client.id.toString();
        if (!acc[clientId]) {
          acc[clientId] = {
            client,
            income: 0,
            expense: 0
          };
        }

        if (record.type === "income") {
          acc[clientId].income += record.amount;
        } else if (record.type === "expense") {
          acc[clientId].expense += record.amount;
        }
      }

      return acc;
    }, {} as GroupedData);

    const transformedData = Object.values(groupedData).map((data) => ({
      client: data.client,
      netAmount: data.income - data.expense,
    }));

    return NextResponse.json({
      message: "Records retrieved successfully",
      count: records.length,
      records: transformedData,
      amount: transformedData.reduce((acc, data) => acc + data.netAmount, 0),
    });
  } catch (error) {
    return NextResponse.json({ message: "Error retrieving records", error }, { status: 500 });
  }
}
