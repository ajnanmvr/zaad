import connect from "@/db/mongo";
import { isPartner } from "@/helpers/isAuthenticated";
import { NextRequest, NextResponse } from "next/server";
import { RecordsService } from "@/services/records.service";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    await connect();
    await isPartner(request);
    const result = await RecordsService.getLiabilitiesSummary();
    if (result.count === 0) {
      return NextResponse.json({ message: "No records found", count: 0, records: [], amount: 0 }, { status: 200 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: "Error retrieving records", error }, { status: 500 });
  }
}
