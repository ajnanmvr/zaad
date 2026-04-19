import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import {
  deletePaymentRecord,
  getPaymentRecordById,
  updatePaymentRecord,
} from "@/services/paymentService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  await connect();
  await requirePermission(request, "payments.read");

  try {
    const { id } = params;
    const data = await getPaymentRecordById(id);
    return Response.json(data, { status: 200 });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to load self transfer record" },
      { status: error?.status || 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connect();
    const principal = await requirePermission(request, "payments.write");
    const { id } = params;
    const reqBody = await request.json();
    const response = await updatePaymentRecord(id, reqBody, principal);
    return Response.json(response.body, { status: response.status });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to update self transfer" },
      { status: error?.status || 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  await connect();
  const principal = await requirePermission(request, "payments.write");
  const { id } = params;
  const response = await deletePaymentRecord(id, principal);
  return Response.json(response.body, { status: response.status });
}