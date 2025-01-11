import { TEmployeeData, TEmployeeList } from "@/types/types";
import Employee from "@/models/employees";
import processDocuments from "@/helpers/processDocuments";
import calculateStatus from "@/utils/calculateStatus";
import { NextRequest } from "next/server";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import connect from "@/db/connect";
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  await isAuthenticated(request);

  const employees: TEmployeeData[] = await Employee.find({
    published: true,
    company: { _id: params.id },
  }).select("name company documents");

  const data: TEmployeeList[] = [];

  employees.forEach((employee) => {
    const { expiryDate, docsCount } = processDocuments(employee.documents);
    const status = calculateStatus(expiryDate);
    data.push({
      id: employee._id,
      name: employee.name,
      company: employee.company,
      expiryDate,
      docs: docsCount,
      status,
    });
  });

  data.sort((a, b) =>
    a.expiryDate === "---"
      ? 1
      : b.expiryDate === "---"
        ? -1
        : new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime()
  );

  return Response.json({ count: employees.length, data }, { status: 200 });
}
