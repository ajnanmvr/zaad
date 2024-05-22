import connect from "@/db/connect";
import Records from "@/models/records";
import { TRecordData } from "@/types/records";

connect();
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const employeeRecords: TRecordData[] = Records.find({
      published: true,
      employee: params.id,
    });

    let incomeTotal = 0;
    let expenseTotal = 0;
    let serviceFee = 0;

    employeeRecords.forEach((record) => {
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
    return Response.json({ data: balance }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: "Error fetching employee data", error },
      { status: 500 }
    );
  }
}
