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
