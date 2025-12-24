import connect from "@/db/mongo";
import { isPartner } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
import { RecordsService } from "@/services/records.service";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await isPartner(request);
    const pageNumber = +(request.nextUrl.searchParams.get("page") || 0);
    const result = await RecordsService.getSelfRecordsSummary("zaad", pageNumber, 10);
    return Response.json(result, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: "An unexpected error occurred", details: error },
      { status: 500 }
    );
  }
}
