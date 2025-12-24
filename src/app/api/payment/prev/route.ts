import connect from "@/db/mongo";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
import { RecordsService } from "@/services/records.service";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    await connect();
    await isAuthenticated(request);
    const { suffix, number } = await RecordsService.getPrevSuffixNumber();
    return Response.json({ suffix, number }, { status: 201 });
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
