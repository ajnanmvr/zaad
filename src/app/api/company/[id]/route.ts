import connect from "@/db/connect";
import calculateStatus from "@/utils/calculateStatus";
import Company from "@/models/companies";
import Records from "@/models/records";
import { format } from "date-fns";
connect();

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const reqBody = await request.json();
  await Company.findByIdAndUpdate(id, reqBody);
  return Response.json(
    { message: "data updated successfully" },
    { status: 201 }
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  await Company.findByIdAndUpdate(id, { published: false });
  return Response.json({ message: "data deleted" }, { status: 200 });
}

interface Company {
  _id: string;
  name: string;
  documents: {
    _id: string;
    expiryDate: string;
    name: string;
    issueDate: string;
  }[];
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const today = new Date();

  try {
    const company: Company | null = await Company.findById(params.id);

    if (!company) {
      return Response.json({ message: "Company not found" }, { status: 404 });
    }

    // Modify documents structure
    const modifiedDocuments = company.documents.map((document) => ({
      id: document._id,
      name: document.name,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      status: calculateStatus(document.expiryDate),
    }));

    // Sort documents in descending order based on expiryDate
    modifiedDocuments.sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );

    const records = await Records.find({
      company: { _id: params.id },
      published: true,
    }).sort({
      createdAt: -1,
    });

    const transformedData = records.map((record) => ({
      company: record?.company?.name,
      type: record.type,
      employee: record?.employee?.name,
      particular: record.particular,
      invoiceNo: record.invoiceNo,
      self: record?.self,
      amount: Number(
        record.cash + record.bank + record.swiper + record.tasdeed
      ),
      date: format(new Date(record.createdAt), "MMM-dd hh:mma"),
    }));

    // Prepare response data
    const responseData = {
      id: company._id,
      name: company.name,
      documents: modifiedDocuments,
      transactions: transformedData,
    };

    return Response.json({ data: responseData }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: "Error fetching company data", error },
      { status: 500 }
    );
  }
}
