import connect from "@/db/mongo";
import { isPartner } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
import { PAGINATION } from "@/config/pagination";
import { listUserActivityHistory } from "@/services/userService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

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
        const limit = parseInt(
            searchParams.get("limit") || String(PAGINATION.LIMITS.USER_ACTIVITY)
        );

        const result = await listUserActivityHistory(id, page, limit);

        return Response.json(result, { status: 200 });

    } catch (error) {
        console.error("Error fetching user activity history:", error);
        return Response.json(
            { error: getServiceErrorMessage(error, "Failed to fetch activity history") },
            { status: getServiceErrorStatus(error) }
        );
    }
}