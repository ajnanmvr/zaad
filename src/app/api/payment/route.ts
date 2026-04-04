import connect from "@/db/mongo";
import { HttpStatusCode } from "axios";
import Records from "@/models/records";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import { mapRecordListItem, PAYMENT_POPULATE_FIELDS } from "./utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.write");
    const reqBody = await request.json();
    const data = await Records.create(reqBody);
    return Response.json(
      { message: "Created new payment record", data },
      { status: HttpStatusCode.Created },
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");
    const searchParams = request.nextUrl.searchParams;
    const pageNumber = searchParams.get("page") || 0;
    const method = searchParams.get("m");
    const type = searchParams.get("t");
    const contentPerSection = 25;

    const query: { [key: string]: any } = { published: true };
    if (method) {
      query.method = method;
    }
    if (type) {
      query.type = type;
    }

    const records = await Records.find(query)
      .populate(PAYMENT_POPULATE_FIELDS)
      .skip(+pageNumber * contentPerSection)
      .limit(contentPerSection + 1)
      .sort({ createdAt: -1 });

    if (!records || records.length === 0) {
      return Response.json(
        { message: "No records found", count: 0, hasMore: false, records: [] },
        { status: 200 },
      );
    }

    const hasMore = records.length > contentPerSection;

    const transformedData = records
      .slice(0, contentPerSection)
      .map(mapRecordListItem);

    return Response.json(
      { count: transformedData.length, hasMore, records: transformedData },
      { status: 200 },
    );
  } catch (error) {
    return Response.json({ error }, { status: 401 });
  }
}
