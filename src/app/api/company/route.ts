import connect from "@/db/connect";
import { TListCompanies } from "@/libs/types";
import Company from "@/models/companies";

connect();

export async function POST(request: Request) {
  try {
    const reqBody = await request.json();
    const data = await Company.create(reqBody);

    return Response.json(
      { message: "Created new company", data },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(error), { status: 401 };
  }
}
interface Document {
  expiryDate: Date;
}

interface CompanyData {
  _id:any;
  name: string;
  documents: Document[];
}

interface CompanyWithOldestExpiry {
  id:any;
  name: string;
  docs: number;
  expiryDate: Date | null;
}

export async function GET() {
  const today = new Date(); // Today's date

  const companies: CompanyData[] =
    await Company.find().select("name documents");

  const data: CompanyWithOldestExpiry[] = [];

  companies.forEach((company) => {
    let expiryDate: Date | null = null;

    company.documents.forEach((document) => {
      if (!expiryDate || document.expiryDate < expiryDate!) {
        expiryDate = document.expiryDate;
      }
    });

    data.push({
      id:company._id,
      name: company.name,
      docs: company.documents.length,
      expiryDate,
    });
  });

  return Response.json({ count: companies.length, data }, { status: 200 });
}
