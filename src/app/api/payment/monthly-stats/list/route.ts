import { NextRequest, NextResponse } from "next/server";
import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { findAllMonthlyFinanceStats } from "@/repositories/paymentRepository";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.view.monthly-stats");

    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get("limit") || "0");

    const stats = await findAllMonthlyFinanceStats(true);
    const data = limit > 0 ? stats.slice(0, limit) : stats;

    return NextResponse.json({
      success: true,
      summary: data,
    });
  } catch (error: unknown) {
    const status = getServiceErrorStatus(error);
    const message = getServiceErrorMessage(error, "Failed to fetch monthly statistics list");

    if (status >= 500) {
      console.error("Error fetching monthly stats list:", error);
    }

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}