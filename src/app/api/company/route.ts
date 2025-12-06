import connect from "@/db/mongo";
import Company from "@/models/companies";
import { TCompanyData, TCompanyList } from "@/types/types";
import calculateStatus from "@/utils/calculateStatus";
import processDocuments from "@/helpers/processDocuments";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
export async function POST(request: NextRequest) {
  try {
    await connect();
    await isAuthenticated(request);
    const reqBody = await request.json();
    const data = await Company.create(reqBody);
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
  const companies: TCompanyData[] = await Company.find({
    published: true,
  }).select("name documents");
  const data: TCompanyList[] = [];

  companies.forEach((company) => {
    const { expiryDate, docsCount } = processDocuments(company.documents);
    const status = calculateStatus(expiryDate);
    data.push({
      id: company._id,
      name: company.name,
      expiryDate,
      docs: docsCount,
      status,
    });
  });

  data.sort((a, b) =>
    a.expiryDate === "---"
      ? 1
      : b.expiryDate === "---"
        ? -1
        : new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime()
  );

  return Response.json({ count: companies.length, data }, { status: 200 });
}
