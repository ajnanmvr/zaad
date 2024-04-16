import connectMongoDB from "@/db/connect";
import Update from "@/models/news";

export async function POST(request: Request) {
  const formdata = await request.json();
  await connectMongoDB();
  const data = await Update.create({
    ...formdata,
    isPublished: true,
  });
  return Response.json(
    { message: "Created new update", data },
    { status: 201 }
  );
}

export async function GET() {
  await connectMongoDB();
  const updates = await Update.find();
  return Response.json({ count: updates.length, updates }, { status: 200 });
}
