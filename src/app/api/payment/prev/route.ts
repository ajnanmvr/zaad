import connect from "@/db/connect";
import { isPartner } from "@/helpers/isAuthenticated";
import Records from "@/models/records";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    await connect();
    await isPartner(request);
    let { suffix, number } = await Records.findOne({
      published: true,
    })
      .sort({ createdAt: -1 })
      .select("suffix number");
    return Response.json({ suffix, number: number || 0 }, { status: 201 });
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
