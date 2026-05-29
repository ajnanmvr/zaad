import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/auth/guards";
import connect from "@/db/mongo";
import { computeMonthlyFinanceStats } from "@/services/paymentService";

/**
 * POST endpoint to recompute current month's monthly finance statistics.
 * Useful for refresh operations to ensure current month data is up-to-date.
 */
export async function POST(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.manage.recompute-monthly-stats");

    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Compute current month stats
    const stats = await computeMonthlyFinanceStats(currentYear, currentMonth);

    return NextResponse.json({
      success: true,
      message: `Monthly stats recomputed for ${currentYear}-${String(currentMonth).padStart(2, "0")}`,
      summary: stats,
    });
  } catch (error: any) {
    console.error("Error recomputing monthly stats:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to recompute monthly statistics" },
      { status: 500 }
    );
  }
}
