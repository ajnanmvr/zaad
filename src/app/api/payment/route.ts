import connect from "@/db/mongo";
import { HttpStatusCode } from "axios";
import { NextRequest } from "next/server";
import { isPartner, isAuthenticated } from "@/helpers/isAuthenticated";
import { RecordsService } from "@/services/records.service";

export const dynamic = "force-dynamic";

const DUBAI_TIME_ZONE = "Asia/Dubai";

export async function POST(request: NextRequest) {
  try {
    await connect();
    await isAuthenticated(request);
    const reqBody = await request.json();
    const data = await RecordsService.createRecord(reqBody);
    return Response.json(
      { message: "Created new payment record", data },
      { status: HttpStatusCode.Created }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await isPartner(request);
    const searchParams = request.nextUrl.searchParams;
    const pageNumber = searchParams.get("page") || 0;
    const method = searchParams.get("m");
    const type = searchParams.get("t");
    const result = await RecordsService.listRecords(method, type, +pageNumber, 25);
    if (result.count === 0) {
      return Response.json(
        { message: "No records found", count: 0, hasMore: false, records: [] },
        { status: 200 }
      );
    }
    return Response.json(result, { status: 200 });
  } catch (error) {
    return Response.json({ error }, { status: 401 });
  }
}
