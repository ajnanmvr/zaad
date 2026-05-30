import { NextRequest, NextResponse } from "next/server";
import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { findAllMonthlyFinanceStats } from "@/repositories/paymentRepository";
import { computeMonthlyFinanceStats } from "@/services/paymentService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.view.monthly-stats");

    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get("limit") || "0");

    const stats = await findAllMonthlyFinanceStats(true);

    // Keep current month accurate by recomputing it on list fetch.
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentKey = `${currentYear}-${currentMonth}`;

    let currentMonthStats = null;
    try {
      currentMonthStats = await computeMonthlyFinanceStats(currentYear, currentMonth);
    } catch (recomputeError) {
      console.error("Failed to recompute current monthly stats:", recomputeError);
    }

    const mergedStats = currentMonthStats
      ? [
          currentMonthStats,
          ...stats.filter(
            (row: any) => `${Number(row?.year || 0)}-${Number(row?.month || 0)}` !== currentKey,
          ),
        ]
      : stats;

    const data = limit > 0 ? mergedStats.slice(0, limit) : mergedStats;

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