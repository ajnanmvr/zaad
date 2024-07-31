import connect from "@/db/connect";
import Records from "@/models/records";

connect();

export async function POST(request: Request) {
  try {
    const { amount, createdBy, to, from } = await request.json();
    await Records.create({
      createdBy,
      type: "expense",
      amount,
      particular: `Money removed from ${from} to add in ${to}`,
      self: "Zaad (Self Deposit)",
      status: "Self Deposit",
      method: from,
    });
    await Records.create({
      createdBy,
      type: "income",
      amount,
      particular: `Money recieved as exchange from ${from}`,
      self: "Zaad (Self Deposit)",
      status: "Self Deposit",
      method: to,
    });
    // const data = await Records.create(reqBody);
    return Response.json({ message:"Self Deposit Completed Successfully" }, { status: 201 });
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
