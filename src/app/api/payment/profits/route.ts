import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { listProfitBalances } from "@/services/paymentService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");
    const response = await listProfitBalances(request.nextUrl.searchParams);
    return Response.json(response, { status: 200 });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
