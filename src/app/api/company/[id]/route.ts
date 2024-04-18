import connectMongoDB from "@/db/connect";
import Company from "@/models/companies";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const reqBody = await request.json();
  await connectMongoDB;
  await Company.findByIdAndUpdate(id, reqBody);
  return Response.json({ msg: "data updated successfully" }, { status: 204 });
}
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  await connectMongoDB;
  const data = await Company.findById(id);
  return Response.json({ data }, { status: 200 });
}
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  await connectMongoDB;
  await Company.findByIdAndDelete(id);
  return Response.json({ message: "data deleted" }, { status: 200 });
}
