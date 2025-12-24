import connect from "@/db/mongo";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
import { CompanyService } from "@/services/company.service";
export async function POST(request: NextRequest) {
  try {
    await connect();
    await isAuthenticated(request);
    const reqBody = await request.json();
    const data = await CompanyService.createCompany(reqBody);
    return Response.json(
      { message: "Created new company", data },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error);
  }
}
export async function GET(request: NextRequest) {
  await connect();
  await isAuthenticated(request);
  const { count, data } = await CompanyService.listCompanySummaries();
  return Response.json({ count, data }, { status: 200 });
}
