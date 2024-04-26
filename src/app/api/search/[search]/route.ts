import connect from "@/db/connect";
import Company from "@/models/companies";
import Employee from "@/models/employees";

connect();

export async function GET(
  request: Request,
  { params }: { params: { search: string } }
) {
  try {
    const companies = await Company.find({
      name: { $regex: params.search, $options: "i" },
      published: true,
    }).select("name");
    const employees = await Employee.find({
      name: { $regex: params.search, $options: "i" },
      published: true,
    }).select("name");

    return Response.json({ companies, employees }, { status: 200 });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return Response.json(
      { error: "An error occurred while fetching companies" },
      { status: 500 }
    );
  }
}
