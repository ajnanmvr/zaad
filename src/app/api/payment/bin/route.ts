import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import Records from "@/models/records";
import { NextRequest } from "next/server";
import { mapRecordListItem, PAYMENT_POPULATE_FIELDS } from "../utils";

const CONTENT_PER_SECTION = 25;

function isAdminRole(role?: string) {
  const normalized = (role || "").toLowerCase();
  return normalized === "admin" || normalized === "superadmin";
}

export async function GET(request: NextRequest) {
  await connect();
  const principal = await requirePermission(request, "payments.read");

  if (!isAdminRole(principal.role)) {
    return Response.json({ error: "Admin role required" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const pageNumber = Number(searchParams.get("page") || 0);
  const search = (searchParams.get("search") || "").trim();

  const query: Record<string, any> = { published: false };
  if (search) {
    query.$or = [
      { particular: { $regex: search, $options: "i" } },
      { invoiceNo: { $regex: search, $options: "i" } },
      { suffix: { $regex: search, $options: "i" } },
    ];
  }

  const records = await Records.find(query)
    .populate(PAYMENT_POPULATE_FIELDS)
    .sort({ deletedAt: -1, updatedAt: -1 })
    .skip(pageNumber * CONTENT_PER_SECTION)
    .limit(CONTENT_PER_SECTION + 1);

  const hasMore = records.length > CONTENT_PER_SECTION;
  const transformedData = records.slice(0, CONTENT_PER_SECTION).map(mapRecordListItem);

  return Response.json(
    {
      count: transformedData.length,
      hasMore,
      records: transformedData,
    },
    { status: 200 }
  );
}
