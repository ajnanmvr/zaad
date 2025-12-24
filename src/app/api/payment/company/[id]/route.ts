import connect from "@/db/mongo";
import { isPartner } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
import { RecordsService } from "@/services/records.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await isPartner(request);
    const result = await RecordsService.getCompanyRecordsSummary(params.id);
    return Response.json(result, { status: 200 });
  } catch (error) {
    return Response.json({ error }, { status: 401 });
  }
}
