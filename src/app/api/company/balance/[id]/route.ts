import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { getCompanyBalance } from "@/services/companyService";


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await requirePermission(request, "entities.read");
    const balance = await getCompanyBalance(params.id);
    return new Response(JSON.stringify({ balance }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error fetching company data", error }),
      { status: 500 }
    );
  }
}
