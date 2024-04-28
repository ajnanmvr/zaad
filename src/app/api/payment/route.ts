import connect from "@/db/connect";
import { format } from "date-fns";

import Records from "@/models/records";
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

export async function GET() {
  const records = await Records.find({ published: true }).sort({
    createdAt: -1,
  });

  const transformedData = records.map((record) => ({
    company: record?.company?.name,
    type: record.type,
    employee: record?.employee?.name,
    particular: record.particular,
    invoiceNo: record.invoiceNo,
    self: record?.self,
    id: record._id,
    amount:
      Number(record.cash) +
      Number(record.bank) +
      Number(record.swiper) +
      Number(record.tasdeed),
    serviceFee: record.serviceFee,
    date: format(new Date(record.createdAt), "MMM-dd hh:mma"),
  }));

  return Response.json(
    { count: transformedData.length, data: transformedData },
    { status: 200 }
  );
}
