import connectMongoDB from "@/db/connect";
import Notification from "@/models/notifications";
connectMongoDB();
export async function POST(request: Request) {
  const formdata = await request.json();
  const data = await Notification.create({
    ...formdata,
    isPublished: true,
  });
  return Response.json(
    { message: "Created new notification", data },
    { status: 201 }
  );
}

export async function GET() {
  const data = await Notification.find();
  return Response.json({ count: data.length, data }, { status: 200 });
}
