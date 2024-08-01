import connect from "@/db/connect";
import Records from "@/models/records";
import { format } from "date-fns";
import { NextRequest } from "next/server";

connect();

export async function GET(request: NextRequest) {
  try {

    const records = await Records.find({
      published: true,
      $or: [{ method: "liability" }, { status: "liability" }],
    })
      .populate(["createdBy", "company", "employee"])
      .sort({ createdAt: -1 });

    if (!records || records.length === 0) {
      return Response.json(
        {
          message: "No records found",
          count: 0,
          records: [],
          balance: 0,
          totalIncome: 0,
        },
        { status: 200 }
      );
    }
    const transformedData = records
      .map((record) => {
        const client = () => {
          const { company, employee, self } = record;
          return company
            ? { name: company.name, id: company._id, type: "company" }
            : employee
              ? { name: employee.name, id: employee._id, type: "employee" }
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
          number: record.number,
          suffix: record.suffix,
          date: format(new Date(record.createdAt), "MMM-dd hh:mma"),
        };
      });

    const allRecords = await Records.find({
      published: true,
      $or: [{ method: "liability" }, { status: "liability" }],
    });

    const totalIncome = allRecords.reduce(
      (acc, record) => acc + (record.type === "income" ? record.amount : 0),
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
