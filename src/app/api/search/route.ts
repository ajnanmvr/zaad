import connect from "@/db/mongo";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
import { SearchService } from "@/services/search.service";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    await connect();
    await isAuthenticated(request);
    const keyword = request.nextUrl.searchParams.get("search");
    const { companies, employees } = await SearchService.search(keyword);
    return Response.json({ companies, employees }, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return Response.json({ error: "An error occurred while fetching data" }, { status: 500 });
  }
}
