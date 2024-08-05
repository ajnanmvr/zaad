// Import necessary modules and models
import connect from "@/db/connect";
import Employee from "@/models/employees";

export async function GET(
  request: Request,
  { params }: { params: { search: string } }
) {
  try {
    await connect();

    const companies = await Employee.find({
      name: { $regex: params.search, $options: "i" },
      published: true,
    }).select("name");

    return Response.json(companies, { status: 200 });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return Response.json(
      { error: "An error occurred while fetching emloyees" },
      { status: 500 }
    );
  }
}
