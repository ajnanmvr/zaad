import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { listPaymentRecords } from "@/services/paymentService";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const searchParams = request.nextUrl.searchParams;
    const pageNumber = Number(searchParams.get("page") || 0);
    const limit = Number(searchParams.get("limit") || 25);
    const sort = searchParams.get("sort") || "newest";
    const query = searchParams.get("q");
    const method = searchParams.get("m");
    const type = searchParams.get("t");
    const status = searchParams.get("s");
    const recordKind = searchParams.get("k");
    const entityIds = searchParams.get("e");
    const officeCategory = searchParams.get("oc");
    const employeeCompanyId = searchParams.get("ec");
    const response = await listPaymentRecords({
      pageNumber,
      limit,
      sort,
      query,
      method,
      type,
      status,
      recordKind,
      entityIds,
      officeCategory,
      employeeCompanyId,
      category: "office_records",
    });

    return Response.json(response, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: "An unexpected error occurred", details: error },
      { status: 500 }
    );
  }
}
