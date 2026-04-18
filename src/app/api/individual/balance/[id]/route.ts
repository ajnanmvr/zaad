import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import Records from "@/models/records";
import Individual from "@/models/individuals";
import { TRecordData } from "@/types/records";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await requirePermission(request, "entities.read");

    const individual = await Individual.findOne({
      _id: params.id,
      published: true,
    })
      .select("_id")
      .lean();

    if (!individual) {
      return new Response(JSON.stringify({ balance: 0 }), { status: 200 });
    }

    const individualRecords: TRecordData[] = await Records.find({
      published: true,
      employee: params.id,
    }).exec();

    let incomeTotal = 0;
    let expenseTotal = 0;

    individualRecords.forEach((record) => {
      if (record.type === "income") {
        incomeTotal += record.amount;
      } else if (record.type === "expense") {
        expenseTotal += record.amount + (record.serviceFee ?? 0);
      }
    });

    const balance = incomeTotal - expenseTotal;
    return new Response(JSON.stringify({ balance }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error fetching individual data", error }),
      { status: 500 }
    );
  }
}
