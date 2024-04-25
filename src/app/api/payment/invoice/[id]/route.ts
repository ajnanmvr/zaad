import connect from "@/db/connect";
import Records from "@/models/records";
import { format } from "date-fns";
connect();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const records = await Records.find({
    published: true,
    invoiceNo: params.id,
    type: "income",
  });

  const transformedData = records.map((record) => ({
    company: record?.company?.name,
    desc:record?.description,
    type: record.type,
    employee: record?.employee?.name,
    particular: record.particular,
    self: record?.self,
    amount:
      Number(record.cash) +
      Number(record.bank) +
      Number(record.swiper) +
      Number(record.tasdeed),
    date: format(new Date(record.createdAt), "MMM-dd hh:mma"),
  }));

  return Response.json(
    { count: transformedData.length, data: transformedData },
    { status: 200 }
  );
}
