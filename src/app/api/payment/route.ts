import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import connect from "@/db/mongo";
import { HttpStatusCode } from "axios";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { createPaymentRecord, listPaymentRecords } from "@/services/paymentService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await connect();
    const principal = await requirePermission(request, "payments.write");
    const reqBody = await request.json();
    const data = await createPaymentRecord(reqBody, principal);
    return Response.json(
      { message: "Created new payment record", data },
      { status: HttpStatusCode.Created },
    );
  } catch (error: any) {
    const errorStatus = getServiceErrorStatus(error);
    if (errorStatus >= 500) {
      console.error("Payment creation error:", error);
    }
    
    // Handle Mongoose validation errors
    if (error?.name === "ValidationError") {
      const validationErrors = Object.values(error.errors || {})
        .map((err: any) => err.message)
        .join("; ");
      return Response.json(
        { error: validationErrors || "Validation failed" },
        { status: 400 },
      );
    }
    
    // Handle other known errors
    if (error?.message) {
      return Response.json(
        { error: error.message },
        { status: 400 },
      );
    }
    
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to create payment record") },
      { status: errorStatus },
    );
  }
}

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
    const category = searchParams.get("category");
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
      category,
    });
    return Response.json(response, { status: 200 });
  } catch (error) {
    const errorStatus = getServiceErrorStatus(error);
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to fetch payment records") },
      { status: errorStatus }
    );
  }
}


