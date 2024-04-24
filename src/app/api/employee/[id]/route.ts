import connect from "@/db/connect";
import Employee from "@/models/employees";
connect();
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const reqBody = await request.json();
  await Employee.findByIdAndUpdate(params.id, reqBody);
  return Response.json(
    { message: "data updated successfully" },
    { status: 201 }
  );
}
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await Employee.findById(params.id);
  return Response.json({ data }, { status: 200 });
}
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await Employee.findByIdAndUpdate(params.id, { published: false });
  return Response.json({ message: "data deleted" }, { status: 200 });
}
