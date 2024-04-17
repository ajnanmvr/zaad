import connect from "@/db/connect";
import Company from "@/models/companies";

connect();

export async function POST(request: Request) {
  try {
    const reqBody = await request.json();
    console.log(reqBody);
    const data = await Company.create(reqBody);
    return Response.json(
      { message: "Created new company", data },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(error), { status: 401 };
  }
}

export async function GET() {
  const Companys = await Company.find();
  return Response.json({ count: Companys.length, Companys }, { status: 200 });
}
