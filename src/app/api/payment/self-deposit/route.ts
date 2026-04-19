import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { createSwapTransfer, listSelfDepositPayments } from "@/services/paymentService";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const searchParams = request.nextUrl.searchParams;
    const pageNumber = Number(searchParams.get("page") || 0);
    const type = searchParams.get("t");
    const method = searchParams.get("m");
    const query = searchParams.get("q");
    const sort = searchParams.get("sort") || "newest";
    
    // Date range parameters
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const month = searchParams.get("month");
    const year = searchParams.get("y");

    const response = await listSelfDepositPayments({
      pageNumber,
      type,
      method,
      query,
      sort,
      from,
      to,
      month,
      year,
    });

    return Response.json(response, { status: 200 });
  } catch (error) {
    const status = getServiceErrorStatus(error);
    return Response.json(
      { error: getServiceErrorMessage(error, "An unexpected error occurred") },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connect();
    const principal = await requirePermission(request, "payments.write");
    const reqBody = await request.json();
    const result = await createSwapTransfer(reqBody, principal);

    return Response.json(result.body, { status: result.status });
  } catch (error: any) {
    const errorStatus = getServiceErrorStatus(error);
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to create self transfer") },
      { status: errorStatus }
    );
  }
}



