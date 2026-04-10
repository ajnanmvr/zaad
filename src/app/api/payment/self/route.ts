import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { listSelfPayments } from "@/services/paymentService";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const searchParams = request.nextUrl.searchParams;
    const pageNumber = Number(searchParams.get("page") || 0);
    const response = await listSelfPayments(pageNumber);

    return Response.json(response, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: "An unexpected error occurred", details: error },
      { status: 500 }
    );
  }
}
