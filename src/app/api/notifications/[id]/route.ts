import connect from "@/db/connect";
import Notification from "@/models/notifications";
connect()
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const {
    newTitle: title,
    newDescription: description,
    newCategory: category,
  } = await request.json();
  await Notification.findByIdAndUpdate(id, { title, description, category });
  return Response.json({ msg: "data updated successfully" }, { status: 204 });
}
export async function GET( request: Request,{ params }: { params: { id: string } }) {
  const { id } = params;
  const data = await Notification.findById(id);
  return Response.json({ data }, { status: 200 });
}
export async function DELETE( request: Request,{ params }: { params: { id: string } }) {
  const { id } = params;
  await Notification.findByIdAndDelete(id);
  return Response.json({ message: "data deleted" }, { status: 200 });
}