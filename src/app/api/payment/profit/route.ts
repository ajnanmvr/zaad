import connect from "@/db/connect";
import { isPartner } from "@/helpers/isAuthenticated";
import Records from "@/models/records";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();
    await isPartner(request);
    const reqBody = await request.json();
    await Records.create(reqBody);
    let { amount, number, type, method, ...rest } = reqBody;
    const serviceFee = amount;
    amount = 0;
    type = "expense";
    method = "service fee";
    number = +number + 1;
    await Records.create({ serviceFee, amount, type, method, number, ...rest });

    return Response.json(
      { message: "Created new payment instant profit record" },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
