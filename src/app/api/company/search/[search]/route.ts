// Import necessary modules and models
import connect from "@/db/mongo";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import Company from "@/models/companies";
import { NextRequest } from "next/server";


export async function GET(
  request: NextRequest,
  { params }: { params: { search: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);
    const companies = await Company.find({
      name: { $regex: params.search, $options: "i" },
      published: true,
    }).select("name");

    return Response.json(companies, { status: 200 });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return Response.json(
      { error: "An error occurred while fetching companies" },
      { status: 500 }
    );
  }
}
