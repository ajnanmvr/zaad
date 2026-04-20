import { NextRequest, NextResponse } from "next/server";
import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { findAllMonthlyFinanceStats } from "@/repositories/paymentRepository";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get("limit") || "0");

    const stats = await findAllMonthlyFinanceStats(true);
    const data = limit > 0 ? stats.slice(0, limit) : stats;

    return NextResponse.json({
      success: true,
      summary: data,
    });
  } catch (error: any) {
    console.error("Error fetching monthly stats list:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch monthly statistics list" },
      { status: 500 },
    );
  }
}