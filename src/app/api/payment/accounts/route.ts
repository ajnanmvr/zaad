import connect from "@/db/mongo";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { filterData } from "@/utils/filterData";
import { NextRequest } from "next/server";
import { RecordsService } from "@/services/records.service";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  try {
    await connect();
    await isAuthenticated(request);
    const filter = filterData(searchParams, true);
    const result = await RecordsService.getAccountsSummary(filter, searchParams.toString() === "");
    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching records:", error);
    return Response.json({ error: "Error fetching records" }, { status: 500 });
  }
}
