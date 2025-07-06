import connect from "@/db/connect";
import { isPartner } from "@/helpers/isAuthenticated";
import Records from "@/models/records";
import { format, toZonedTime } from "date-fns-tz";
import { NextRequest } from "next/server";

const DUBAI_TIME_ZONE = 'Asia/Dubai';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await isPartner(request);
    const searchParams = request.nextUrl.searchParams;
    const pageNumber = searchParams.get("page") || 0;
    const contentPerSection = 10;

    const records = await Records.find({
      published: true,
      company: { _id: params.id },
    })
      .populate(["createdBy", "company", "employee"])
      .skip(+pageNumber * contentPerSection)
      .limit(contentPerSection + 1)
      .sort({ createdAt: -1 });

    if (!records || records.length === 0) {
      return Response.json(
        {
          message: "No records found",
          count: 0,
          hasMore: false,
          records: [],
          balance: 0,
          totalIncome: 0,
          totalExpense: 0,
          totalTransactions: 0,
        },
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
          number: record.number,
          suffix: record.suffix,
          date: format(createdAtInDubai, "MMM-dd hh:mma", { timeZone: DUBAI_TIME_ZONE }),
        };
      });

    const allRecords = await Records.find({
      published: true,
      company: { _id: params.id },
    });

    const totalIncome = allRecords.reduce(
      (acc, record) =>
        acc +
        (record.type === "income" && record.method !== "liability"
          ? record.amount
          : 0),
      0
    );
    const totalExpense = allRecords.reduce(
      (acc, record) =>
        acc +
        (record.type === "expense" ? record.amount : 0) +
        (record.serviceFee || 0),
      0
    );
    const balance = totalIncome - totalExpense;
    const totalTransactions = allRecords.length;

    return Response.json(
      {
        count: transformedData.length,
        hasMore,
        records: transformedData,
        balance,
        totalIncome,
        totalExpense,
        totalTransactions,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json({ error }, { status: 401 });
  }
}
