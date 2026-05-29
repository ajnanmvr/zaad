import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { deleteSelfTransferByGroupId } from "@/services/paymentService";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } },
) {
  await connect();
  const principal = await requirePermission(request, "payments.write");
  const { groupId } = params;
  const response = await deleteSelfTransferByGroupId(groupId, principal);
  return Response.json(response.body, { status: response.status });
}