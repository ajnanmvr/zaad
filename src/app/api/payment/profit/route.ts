import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { createProfitPair } from "@/services/paymentService";

export async function POST(request: NextRequest) {
  try {
    await connect();
    const principal = await requirePermission(request, "payments.write");
    const reqBody = await request.json();
    await createProfitPair(reqBody, principal);

    return Response.json(
      { message: "Created new payment instant profit record" },
      { status: 201 }
    );
  } catch (error: any) {
    const message = error?.message || "Failed to create instant profit record";
    const status = typeof error?.status === "number" ? error.status : 400;
    return Response.json({ error: message }, { status });
  }
}
