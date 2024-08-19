import connect from "@/db/connect";
import Records from "@/models/records";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    await connect();
    const { amount, createdBy, to, from } = await request.json();
    let { suffix, number } = await Records.findOne({
      published: true,
    })
      .sort({ createdAt: -1 })
      .select("suffix number");

    let newSuffix = suffix || "",
      newNumber = number || 0;
    await Records.create({
      createdBy,
      type: "expense",
      amount,
      suffix: newSuffix,
      number: newNumber + 1,
      particular: `Money removed from ${from} to add in ${to}`,
      self: "Zaad (Self Deposit)",
      status: "Self Deposit",
      method: from,
    });
    await Records.create({
      createdBy,
      type: "income",
      amount,
      suffix: newSuffix,
      number: newNumber + 2,
      particular: `Money recieved as exchange from ${from}`,
      self: "Zaad (Self Deposit)",
      status: "Self Deposit",
      method: to,
    });
    return Response.json(
      { message: "Self Deposit Completed Successfully" },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
