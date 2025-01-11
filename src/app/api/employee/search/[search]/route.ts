// Import necessary modules and models
import connect from "@/db/connect";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import Employee from "@/models/employees";
import { NextRequest } from "next/server";

export async function GET(
  request:NextRequest,
  { params }: { params: { search: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);

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
