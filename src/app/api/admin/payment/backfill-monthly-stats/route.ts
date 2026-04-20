import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/auth/guards";
import connect from "@/db/mongo";
import { backfillMonthlyFinanceStats } from "@/services/paymentService";

/**
 * Admin endpoint to backfill historical monthly finance statistics.
 * 
 * POST /api/admin/payment/backfill-monthly-stats
 * 
 * Query parameters (optional):
 * - year: Number - Start year for backfill (defaults to earliest record year)
 * - month: Number 1-12 - Start month for backfill (defaults to earliest record month)
 */
export async function POST(request: NextRequest) {
  try {
    await connect();
    
    // Require admin role for this endpoint
    await requirePermission(request, "payments.admin");

    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    // Parse optional parameters
    const startYear = year ? Number(year) : undefined;
    const startMonth = month ? Number(month) : undefined;

    if (startYear && (startYear < 2000 || startYear > 2100)) {
      return NextResponse.json(
        { error: "Invalid year. Must be between 2000 and 2100" },
        { status: 400 }
      );
    }

    if (startMonth && (startMonth < 1 || startMonth > 12)) {
      return NextResponse.json(
        { error: "Invalid month. Must be between 1 and 12" },
        { status: 400 }
      );
    }

    const result = await backfillMonthlyFinanceStats(startYear, startMonth);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error backfilling monthly stats:", error);

    // Check if it's a permission error
    if (error?.message?.includes("Permission denied") || error?.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to backfill monthly statistics" },
      { status: 500 }
    );
  }
}
