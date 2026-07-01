import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { listCompanyPaymentRecords } from "@/services/paymentService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const scopeParam = request.nextUrl.searchParams.get("recordScope");
    const recordScope =
      scopeParam === "employees" || scopeParam === "mixed"
        ? scopeParam
        : "company";

    const searchParams = request.nextUrl.searchParams;

    const companyId = params.id;
    const response = await listCompanyPaymentRecords(companyId, {
      recordScope,
      pageNumber: Number(searchParams.get("page") || 0),
      limit: Number(searchParams.get("limit") || 25),
      sort: searchParams.get("sort"),
      query: searchParams.get("q"),
      method: searchParams.get("m"),
      type: searchParams.get("t"),
      status: searchParams.get("s"),
      recordKind: searchParams.get("k"),
      officeCategory: searchParams.get("oc"),
      category: searchParams.get("category"),
      dateFrom: searchParams.get("df"),
      dateTo: searchParams.get("dt"),
    });
    return Response.json(response, { status: 200 });
  } catch (error) {
    const status = getServiceErrorStatus(error);
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to fetch company payment records") },
      { status }
    );
  }
}
