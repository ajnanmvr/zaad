import connect from "@/db/connect";
import Records from "@/models/records";
connect();

export async function POST(request: Request) {
  try {
    const reqBody = await request.json();
    const data = await Records.create(reqBody);

    return Response.json(
      { message: "Created new payment record", data },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}

export async function GET() {
  const data = await Records.find();
  return Response.json({ count: data.length, data }, { status: 200 });
}
