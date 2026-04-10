import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { createSwapTransfer } from "@/services/paymentService";

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    await connect();
    const principal = await requirePermission(request, "payments.write");
    const { amount, to, from } = await request.json();
    const response = await createSwapTransfer({ amount, to, from }, principal);
    return Response.json(response.body, { status: response.status });
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
