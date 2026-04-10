import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { isAdminRole, listPaymentBin } from "@/services/paymentService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connect();
    const principal = await requirePermission(request, "payments.read");

    if (!isAdminRole(principal.role)) {
      return Response.json({ error: "Admin role required" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const pageNumber = Number(searchParams.get("page") || 0);
    const search = (searchParams.get("search") || "").trim();
    const response = await listPaymentBin({ pageNumber, search });

    return Response.json(
      response,
      { status: 200 }
    );
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to fetch bin records" },
      { status: error?.status || 500 }
    );
  }
}
