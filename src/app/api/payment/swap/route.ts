import connect from "@/db/mongo";
import { isPartner } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
import { RecordsService } from "@/services/records.service";

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    await connect();
    await isPartner(request);
    const { amount, createdBy, to, from } = await request.json();
    await RecordsService.swapAccounts(amount, createdBy, to, from);
    return Response.json(
      { message: "Self Deposit Completed Successfully" },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
