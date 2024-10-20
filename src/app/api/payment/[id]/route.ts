import Records from "@/models/records";
import connect from "@/db/connect";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await connect();
  const { id } = params;
  await Records.findByIdAndUpdate(id, { published: false });
  return Response.json({ message: "data deleted" }, { status: 200 });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  await connect();
  try {
    const { id } = params;
    const data = await Records.findById(id);
    return Response.json(data, { status: 200 });
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  await connect();
  const { id } = params;
  try {
    const reqBody = await request.json();
    const data = await Records.findByIdAndUpdate(id, {
      ...reqBody,
      edited: true,
    });
    return Response.json({ message: "data updated", data }, { status: 200 });
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
