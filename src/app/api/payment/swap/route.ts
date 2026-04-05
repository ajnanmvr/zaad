import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import Records from "@/models/records";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    await connect();
    const principal = await requirePermission(request, "payments.write");
    const { amount, to, from } = await request.json();

    if (!from || !to) {
      return Response.json({ message: "Please select both payment methods" }, { status: 400 });
    }

    if (from === to) {
      return Response.json({ message: "From and to methods must be different" }, { status: 400 });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return Response.json({ message: "The amount should be greater than 0" }, { status: 400 });
    }

    let { suffix, number } = await Records.findOne({
      published: true,
    })
      .sort({ createdAt: -1 })
      .select("suffix number");

    let newSuffix = suffix || "",
      newNumber = number || 0;
    await Records.create({
      createdBy: principal.userId,
      type: "expense",
      amount: numericAmount,
      suffix: newSuffix,
      number: newNumber + 1,
      particular: `Money removed from ${from} to add in ${to}`,
      self: "Zaad (Self Deposit)",
      status: "Self Deposit",
      method: from,
      activityLog: [
        {
          action: "create",
          at: new Date(),
          by: principal.userId,
          byUsername: principal.username,
          byFullname: principal.fullname,
          details: "Self transfer out transaction created",
        },
      ],
    });
    await Records.create({
      createdBy: principal.userId,
      type: "income",
      amount: numericAmount,
      suffix: newSuffix,
      number: newNumber + 2,
      particular: `Money recieved as exchange from ${from}`,
      self: "Zaad (Self Deposit)",
      status: "Self Deposit",
      method: to,
      activityLog: [
        {
          action: "create",
          at: new Date(),
          by: principal.userId,
          byUsername: principal.username,
          byFullname: principal.fullname,
          details: "Self transfer in transaction created",
        },
      ],
    });
    return Response.json(
      { message: "Self Deposit Completed Successfully" },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
