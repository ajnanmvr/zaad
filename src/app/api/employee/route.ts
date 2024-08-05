import connect from "@/db/connect";
import { TEmployeeData, TEmployeeList } from "@/types/types";
import Employee from "@/models/employees";
import calculateStatus from "@/utils/calculateStatus";
import processDocuments from "@/helpers/processDocuments";
export async function POST(request: Request) {
  try {
await connect();

    const reqBody = await request.json();
    console.log(reqBody);
    const data = await Employee.create(reqBody);

    return Response.json(
      { message: "Created new employee", data },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}

export async function GET() {
  await connect();

  const employees: TEmployeeData[] = await Employee.find({
    published: true,
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
