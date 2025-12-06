import connect from "@/db/mongo";
import calculateStatus from "@/utils/calculateStatus";
import Company from "@/models/companies";
import { TCompanyData } from "@/types/types";
import { NextRequest } from "next/server";
import { isAuthenticated } from "@/helpers/isAuthenticated";


export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  await isAuthenticated(request);

  const { id } = params;
  const reqBody = await request.json();
  await Company.findByIdAndUpdate(id, reqBody);
  return Response.json(
    { message: "data updated successfully" },
    { status: 201 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  await isAuthenticated(request);

  const { id } = params;
  await Company.findByIdAndUpdate(id, { published: false });
  return Response.json({ message: "data deleted" }, { status: 200 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);

    const company: TCompanyData | null = await Company.findById(params.id);

    if (!company) {
      return Response.json({ message: "Company not found" }, { status: 404 });
    }

    const modifiedDocuments = company.documents.map(
      ({ _id, name, issueDate, expiryDate }) => ({
        _id,
        name,
        issueDate,
        expiryDate,
        status: calculateStatus(expiryDate),
      })
    );

    modifiedDocuments.sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );

    const responseData = {
      id: company._id,
      name: company.name,
      licenseNo: company.licenseNo,
      companyType: company.companyType,
      emirates: company.emirates,
      phone1: company.phone1,
      phone2: company.phone2,
      email: company.email,
      transactionNo: company.transactionNo,
      isMainland: company.isMainland,
      remarks: company.remarks,
      password: company.password,
      documents: modifiedDocuments,
    };

    return Response.json({ data: responseData }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: "Error fetching company data", error },
      { status: 500 }
    );
  }
}
