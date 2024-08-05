import connect from "@/db/connect";
import Records from "@/models/records";

export async function GET(request: Request) {
  try {
    await connect();
    let { suffix, number } = await Records.findOne({
      published: true,
    })
      .sort({ createdAt: -1 })
      .select("suffix number");
    return Response.json(
      { suffix, number: 1 + (number || 0) },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
