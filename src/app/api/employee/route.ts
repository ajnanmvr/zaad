import connect from "@/db/connect";
import { TCompanyData, TEmployeeData, TEmployeeList } from "@/types/types";
import Employee from "@/models/employees";

connect();

export async function POST(request: Request) {
  try {
    const reqBody = await request.json();
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
  const today = new Date();

  const employees: TEmployeeData[] = await Employee.find({
    published: true,
  }).select("name company documents");

  const data: TEmployeeList[] = [];

  employees.forEach((employee) => {
    let expiryDate: string | null = null;

    employee.documents.forEach((document) => {
      if (
        !expiryDate ||
        new Date(document.expiryDate).getTime() < new Date(expiryDate).getTime()
      ) {
        expiryDate = document.expiryDate;
      }
    });

    let status: TEmployeeList["status"] = "unknown"; // Default status
    let formattedExpiryDate = "---";
    if (expiryDate) {
      const expiryDateTime = new Date(expiryDate).getTime();
      const timeDiff = expiryDateTime - today.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24); // Convert milliseconds to days

      if (daysDiff < 0) {
        status = "expired";
      } else if (daysDiff <= 30) {
        status = "renewal";
      } else if (daysDiff > 30) {
        status = "valid";
      }
      formattedExpiryDate = new Date(expiryDateTime).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "2-digit",
        }
      );
    }

    data.push({
      id: employee._id,
      name: employee.name,
      company: { _id: employee.company._id, name: employee.company.name },
      expiryDate: formattedExpiryDate,
      docs: employee.documents.length,
      status,
    });
  });

  // Sort the data by expiryDate, oldest first, null values last
  data.sort((a, b) => {
    if (!a.expiryDate && !b.expiryDate) return 0; // If both dates are null, maintain order
    if (!a.expiryDate) return 1; // Put items with null dates last
    if (!b.expiryDate) return -1; // Put items with null dates last
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });

  return Response.json({ count: employees.length, data }, { status: 200 });
}
