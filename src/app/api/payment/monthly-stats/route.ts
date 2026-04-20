import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/auth/guards";
import connect from "@/db/mongo";
import { computeMonthlyFinanceStats } from "@/services/paymentService";
import { findMonthlyFinanceStatsByYearMonth } from "@/repositories/paymentRepository";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const compute = searchParams.get("compute") === "true";

    // Parse year and month - default to current if not provided
    const now = new Date();
    const requestYear = year ? Number(year) : now.getFullYear();
    const requestMonth = month ? Number(month) : now.getMonth() + 1;

    // Validate month is 1-12
    if (requestMonth < 1 || requestMonth > 12) {
      return NextResponse.json(
        { error: "Invalid month. Must be between 1 and 12" },
        { status: 400 }
      );
    }

    let stats = null;

    // Try to fetch existing stats or compute if requested
    if (compute) {
      // Force recomputation
      stats = await computeMonthlyFinanceStats(requestYear, requestMonth);
    } else {
      // Try to fetch from cache first
      stats = await findMonthlyFinanceStatsByYearMonth(requestYear, requestMonth);

      // If not found and it's current month, compute it
      if (!stats && requestYear === now.getFullYear() && requestMonth === now.getMonth() + 1) {
        stats = await computeMonthlyFinanceStats(requestYear, requestMonth);
      }
    }

    if (!stats) {
      return NextResponse.json(
        {
          error: "Monthly statistics not found",
          hint: "Use ?compute=true to generate statistics for this month",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      summary: stats,
    });
  } catch (error: any) {
    console.error("Error fetching monthly stats:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch monthly statistics" },
      { status: 500 }
    );
  }
}
