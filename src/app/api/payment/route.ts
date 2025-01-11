import connect from "@/db/connect";
import { HttpStatusCode } from 'axios';  
import Records from "@/models/records";
import { toZonedTime, format } from "date-fns-tz";
import { NextRequest } from "next/server";
import { isPartner } from "@/helpers/isAuthenticated";

export const dynamic = "force-dynamic";

const DUBAI_TIME_ZONE = 'Asia/Dubai';

export async function POST(request: NextRequest) {
  try {
    await connect();
    await isPartner(request);
    const reqBody = await request.json();
    const data = await Records.create(reqBody);
    return Response.json(
      { message: "Created new payment record", data },
      { status: HttpStatusCode.Created }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await isPartner(request);
    const searchParams = request.nextUrl.searchParams;
    const pageNumber = searchParams.get("page") || 0;
    const method = searchParams.get("m");
    const type = searchParams.get("t");
    const contentPerSection = 25;

    const query: { [key: string]: any } = { published: true };
    if (method) {
      query.method = method;
    }
    if (type) {
      query.type = type;
    }

    const records = await Records.find(query)
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

        const createdAtInDubai = toZonedTime(record.createdAt, DUBAI_TIME_ZONE);

        return {
          id: record._id,
          type: record.type,
          client: client(),
          method: record.method,
          particular: record.particular,
          invoiceNo: record.invoiceNo,
          amount: record.amount?.toFixed(2),
          serviceFee: record.serviceFee?.toFixed(2),
          creator: record?.createdBy?.username,
          status: record.status,
          remarks: record.remarks,
          number: record.number,
          suffix: record.suffix,
          edited:record.edited,
          date: format(createdAtInDubai, "MMM-dd hh:mma", { timeZone: DUBAI_TIME_ZONE }),
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
