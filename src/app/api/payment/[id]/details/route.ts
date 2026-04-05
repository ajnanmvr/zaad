import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import Records from "@/models/records";
import { NextRequest } from "next/server";
import { mapRecordListItem, PAYMENT_POPULATE_FIELDS } from "../../utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  await requirePermission(request, "payments.read");

  const { id } = params;
  const record = await Records.findById(id).populate(PAYMENT_POPULATE_FIELDS);

  if (!record) {
    return Response.json({ error: "Record not found" }, { status: 404 });
  }

  return Response.json({ record: mapRecordListItem(record) }, { status: 200 });
}
