import connect from "@/db/connect";
import Company from "@/models/companies";
import Employee from "@/models/employees";
connect();

export async function GET() {
  const employees = await Employee.countDocuments();
  const companies = await Company.countDocuments();

  return Response.json(
    { company: companies, employee: employees },
    { status: 200 }
  );
}
