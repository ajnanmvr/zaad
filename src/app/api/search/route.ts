import connect from "@/db/connect";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import Company from "@/models/companies";
import Employee from "@/models/employees";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    await connect();
    await isAuthenticated(request);
    const keyword = request.nextUrl.searchParams.get("search");
    const companies = await Company.find({ name: { $regex: keyword, $options: "i" }, published: true }).select("name");
    const employees = await Employee.find({ name: { $regex: keyword, $options: "i" }, published: true }).select("name");
    return Response.json({ companies, employees }, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return Response.json({ error: "An error occurred while fetching data" }, { status: 500 });
  }
}
