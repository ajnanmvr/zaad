import connect from "@/db/connect";
import Company from "@/models/companies";
import Employee from "@/models/employees";
connect();
export const dynamic = 'force-dynamic'
export async function GET() {
  const employees = await Employee.countDocuments({ published: true });
  const companies = await Company.countDocuments({ published: true });

  return Response.json(
    { company: companies, employee: employees },
    { status: 200 }
  );
}
