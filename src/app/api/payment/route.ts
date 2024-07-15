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
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageNumber = searchParams.get("page") || 0;
    const contentPerSection = 10;

    const records = await Records.find({ published: true })
      .populate(["createdBy", "company", "employee"])
      .skip(+pageNumber * contentPerSection)
      .limit(contentPerSection + 1)
      .sort({ createdAt: -1 });

    if (!records || records.length === 0) {
      return Response.json(
        { message: "No records found", count: 0, hasMore: false, records: [] },
        { status: 200 }
      );
    }
    const hasMore = records.length > contentPerSection;
    const transformedData = records
      .slice(0, contentPerSection)
      .map((record) => {
        const client = () => {
          const { company, employee, self } = record;
          return company
            ? { name: company.name, id: company._id, type: "company" }
            : employee
              ? { name: employee.name, id: employee._id, type: "employee" }
              : self
                ? { name: self, type: "self" }
                : null;
        };

        return {
          id: record._id,
          type: record.type,
          client: client(),
          method: record.method,
          particular: record.particular,
          invoiceNo: record.invoiceNo,
          amount: record.amount?.toFixed(2),
          serviceFee: record.serviceFee?.toFixed(2),
          creator: record.createdBy.username,
          status: record.status,
          date: format(new Date(record.createdAt), "MMM-dd hh:mma"),
        };
      });

    return Response.json(
      { count: transformedData.length, hasMore, records: transformedData },
      { status: 200 }
    );
  } catch (error) {
    return Response.json({ error }, { status: 401 });
  }
}
