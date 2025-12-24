import connect from "@/db/mongo";
import { isPartner } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
import { RecordsService } from "@/services/records.service";

export async function POST(request: NextRequest) {
  try {
    await connect();
    await isPartner(request);
    const reqBody = await request.json();
    await RecordsService.createInstantProfit(reqBody);

    return Response.json(
      { message: "Created new payment instant profit record" },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
