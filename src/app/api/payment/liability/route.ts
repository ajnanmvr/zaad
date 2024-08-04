import connect from "@/db/connect";
import Records from "@/models/records";
import { NextRequest, NextResponse } from "next/server";

connect();
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const records = await Records.find({
      published: true,
      $or: [{ method: "liability" }, { status: "liability" }],
    })
      .populate(["createdBy", "company", "employee"])
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
      type: "company" | "employee";
    }

    interface GroupedData {
      [key: string]: {
        client: Client;
        income: number;
        expense: number;
      };
    }

    const groupedData = records.reduce((acc: GroupedData, record: any) => {
      const client: Client | null = (() => {
        const { company, employee } = record;
        return company
          ? { name: company.name, id: company._id, type: "company" }
          : employee
            ? { name: employee.name, id: employee._id, type: "employee" }
            : null;
      })();

      if (client) {
        if (!acc[client.id]) {
          acc[client.id] = {
            client,
            income: 0,
            expense: 0
          };
        }

        if (record.type === "income") {
          acc[client.id].income += record.amount;
        } else if (record.type === "expense") {
          acc[client.id].expense += record.amount;
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
