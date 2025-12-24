import connect from "@/db/mongo";
import { isPartner } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
import { UserActivityService } from "@/services/userActivity.service";

// GET - Get user activity history (partners only)
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connect();
        await isPartner(request);

        const { id } = params;
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "0");
        const limit = parseInt(searchParams.get("limit") || "10");

        const result = await UserActivityService.getHistory(id, page, limit);

        return Response.json(result, { status: 200 });

    } catch (error) {
        console.error("Error fetching user activity history:", error);
        return Response.json(
            { error: "Failed to fetch activity history" },
            { status: 500 }
        );
    }
}