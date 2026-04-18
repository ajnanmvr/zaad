import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { listCompanyPaymentRecords } from "@/services/paymentService";

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

    const companyId = params.id;
    const response = await listCompanyPaymentRecords(companyId, recordScope);
    return Response.json(response, { status: 200 });
  } catch (error) {
    return Response.json({ error }, { status: 401 });
  }
}
