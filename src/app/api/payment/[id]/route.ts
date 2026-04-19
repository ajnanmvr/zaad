import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import {
  deletePaymentRecord,
  getPaymentRecordById,
  isAdminRole,
  recoverPaymentRecord,
  updatePaymentRecord,
} from "@/services/paymentService";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  const principal = await requirePermission(request, "payments.write");
  const { id } = params;
  const response = await deletePaymentRecord(id, principal);
  return Response.json(response.body, { status: response.status });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  await requirePermission(request, "payments.read");
  try {
    const { id } = params;
    const data = await getPaymentRecordById(id);
    return Response.json(data, { status: 200 });
  } catch (error) {
    const status = getServiceErrorStatus(error);
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to fetch payment record") },
      { status }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    const principal = await requirePermission(request, "payments.write");
    const { id } = params;
    const reqBody = await request.json();
    const response = await updatePaymentRecord(id, reqBody, principal);
    return Response.json(response.body, { status: response.status });
  } catch (error: any) {
    const status = getServiceErrorStatus(error);
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to update payment record") },
      { status }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  const principal = await requirePermission(request, "payments.write");

  if (!isAdminRole(principal.role)) {
    return Response.json({ error: "Admin role required" }, { status: 403 });
  }

  const { id } = params;
  const reqBody = await request.json();

  if (reqBody?.action !== "recover") {
    return Response.json({ error: "Unsupported action" }, { status: 400 });
  }

  const response = await recoverPaymentRecord(id, principal);
  return Response.json(response.body, { status: response.status });
}
