import connect from "@/db/connect";
import Records from "@/models/records";
import { format } from "date-fns";
import { NextRequest } from "next/server";

connect();

export async function POST(request: Request) {
  try {
    const reqBody = await request.json();
    const data = await Records.create(reqBody);
    return Response.json(
      { message: "Created new payment record", data },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sectionNumber = searchParams.get("section") || 0;
  const contentPerSection = 20;

  const records = await Records.find({ published: true })
    .populate(["createdBy", "company", "employee"])
    .skip(+sectionNumber * contentPerSection)
    .limit(contentPerSection)
    .sort({ createdAt: -1 });

  const transformedData = records.map((record) => {
    const client = () => {
      if (record?.company?._id) {
        return {
          name: record.company.name,
          id: record.company._id,
          type: "company",
        };
      } else if (record?.employee?._id) {
        return {
          name: record.employee.name,
          id: record.employee._id,
          type: "employee",
        };
      } else if (record?.self) {
        return {
          name: record.self,
          type: "self",
        };
      }
    };

    return {
      id: record._id,
      type: record.type,
      client: client(),
      method: record.method,
      particular: record.particular,
      invoiceNo: record.invoiceNo,
      amount: record.amount,
      serviceFee: record.serviceFee,
      creator: record.createdBy.username,
      status: record.status,
      date: format(new Date(record.createdAt), "MMM-dd hh:mma"),
    };
  });

  return Response.json(
    { count: transformedData.length, records: transformedData },
    { status: 200 }
  );
}
