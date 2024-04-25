// Import necessary modules and models
import connect from "@/db/connect";
import Employee from "@/models/employees";

connect();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.searchParams);
    const searchQuery = searchParams.get("search");
    const companies = await Employee.find({name: { $regex: searchQuery, $options: "i" },published:true}).select("name");

    return Response.json(companies,{status:200});
  } catch (error) {
    console.error("Error fetching companies:", error);
    return  Response.json({ error: "An error occurred while fetching companies" },{status:500});
  }
}
