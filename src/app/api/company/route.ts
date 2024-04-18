import connect from "@/db/connect";
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
    return Response.json(error, { status: 401 });
  }
}

interface Document {
  expiryDate: string;
}

interface CompanyData {
  name: string;
  _id:string;
  documents: Document[];
}

interface CompanyWithOldestExpiry {
  id:string;
  name: string;
  expiryDate: string | null;
  docs: number;
  status: "expired" | "renewal" | "valid";
}

export async function GET() {
  const today = new Date();

  const companies: CompanyData[] =
    await Company.find().select("name documents");

  const data: CompanyWithOldestExpiry[] = [];

  companies.forEach((company) => {
    let expiryDate: string | null = null;

    company.documents.forEach((document) => {
      if (
        !expiryDate ||
        new Date(document.expiryDate).getTime() <
          new Date(expiryDate).getTime()!
      ) {
        expiryDate = document.expiryDate;
      }
    });

    let status: CompanyWithOldestExpiry["status"] = "valid"; // Default status

    if (expiryDate) {
      const expiryDateTime = new Date(expiryDate).getTime();
      const timeDiff = expiryDateTime - today.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24); // Convert milliseconds to days

      if (daysDiff < 0) {
        status = "expired";
      } else if (daysDiff <= 30) {
        status = "renewal";
      }
      const formattedExpiryDate = new Date(expiryDateTime).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "2-digit",
        },
      );

      data.push({
        id:company._id,
        name: company.name,
        expiryDate: formattedExpiryDate,
        docs: company.documents.length,
        status,
      });
    }
  });
  data.sort(
    (a, b) =>
      new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime(),
  );
  return Response.json({ count: companies.length, data }, { status: 200 });
}
