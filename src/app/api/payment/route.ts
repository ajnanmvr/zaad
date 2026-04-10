import connect from "@/db/mongo";
import { HttpStatusCode } from "axios";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { createPaymentRecord, listPaymentRecords } from "@/services/paymentService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await connect();
    const principal = await requirePermission(request, "payments.write");
    const reqBody = await request.json();
    const data = await createPaymentRecord(reqBody, principal);
    return Response.json(
      { message: "Created new payment record", data },
      { status: HttpStatusCode.Created },
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");
    const searchParams = request.nextUrl.searchParams;
    const pageNumber = Number(searchParams.get("page") || 0);
    const method = searchParams.get("m");
    const type = searchParams.get("t");
    const response = await listPaymentRecords({ pageNumber, method, type });
    return Response.json(response, { status: 200 });
  } catch (error) {
    return Response.json({ error }, { status: 401 });
  }
}
