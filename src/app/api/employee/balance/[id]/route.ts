import connect from "@/db/mongo";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
import { RecordsService } from "@/services/records.service";


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);
    const { balance } = await RecordsService.getEmployeeBalance(params.id);
    return new Response(JSON.stringify({ balance }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error fetching employee data", error }),
      { status: 500 }
    );
  }
}
