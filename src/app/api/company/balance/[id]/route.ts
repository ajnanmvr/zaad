import connect from "@/db/connect";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import Records from "@/models/records";
import { TRecordData } from "@/types/records";
import { NextRequest } from "next/server";


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
await connect();
await isAuthenticated(request);
    const companyRecords: TRecordData[] = await Records.find({
      published: true,
      company: params.id,
    }).exec();

    let incomeTotal = 0;
    let expenseTotal = 0;
    let serviceFee = 0;

    companyRecords.forEach((record) => {
      if (record.type === "income") {
        incomeTotal += record.amount;
      } else if (record.type === "expense") {
        expenseTotal += record.amount + (record.serviceFee ?? 0);
        if (record.serviceFee) {
          serviceFee += record.serviceFee;
        }
      }
    });

    const balance = incomeTotal - expenseTotal;
    return new Response(JSON.stringify({ balance }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error fetching company data", error }),
      { status: 500 }
    );
  }
}
