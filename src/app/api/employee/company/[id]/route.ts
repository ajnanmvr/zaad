import { TCompanyData } from "@/libs/types";
import Employee from "@/models/employees";

interface Document {
  expiryDate: string;
}

interface EmployeeData {
  name: string;
  _id: string;
  company: TCompanyData;
  documents: Document[];
}

interface EmployeeWithOldestExpiry {
  id: string;
  name: string;
  expiryDate: string | null;
  docs: number;
  company: { id?: string; name: string };
  status: "expired" | "renewal" | "valid" | "none";
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const today = new Date();
  const employees: EmployeeData[] = await Employee.find({ company:{_id: params.id} }).select('name company documents');

  const data: EmployeeWithOldestExpiry[] = [];

  employees.forEach((employee) => {
    let expiryDate: string | null = null;

    employee.documents.forEach((document) => {
      if (
        !expiryDate ||
        new Date(document.expiryDate).getTime() <
          new Date(expiryDate).getTime()!
      ) {
        expiryDate = document.expiryDate;
      }
    });

    let status: EmployeeWithOldestExpiry["status"] = "valid"; // Default status
    let formattedExpiryDate = "none";
    if (expiryDate) {
      const expiryDateTime = new Date(expiryDate).getTime();
      const timeDiff = expiryDateTime - today.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24); // Convert milliseconds to days

      if (daysDiff < 0) {
        status = "expired";
      } else if (daysDiff <= 30) {
        status = "renewal";
      }
      formattedExpiryDate = new Date(expiryDateTime).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "2-digit",
        },
      );
    }

    data.push({
      id: employee._id,
      name: employee.name,
      company: { id: employee.company._id, name: employee.company.name },
      expiryDate: formattedExpiryDate,
      docs: employee.documents.length,
      status,
    });
  });
  data.sort(
    (a, b) =>
      new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime(),
  );
  return Response.json({ count: employees.length, data }, { status: 200 });
}
