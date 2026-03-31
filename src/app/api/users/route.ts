import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { NextRequest } from "next/server";
import { PAGINATION } from "@/config/pagination";
import { createUser, listUsers } from "@/services/userService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

// GET - List all users (requires users.read)
export async function GET(request: NextRequest) {
    try {
        await connect();
        await requirePermission(request, "users.read");

        const searchParams = request.nextUrl.searchParams;
        const pageNumber = parseInt(searchParams.get("page") || "0");
        const limit = parseInt(
            searchParams.get("limit") || String(PAGINATION.LIMITS.USER_LIST)
        );
        const search = searchParams.get("search") || "";
        const showDeleted = searchParams.get("deleted") === "true";

        const result = await listUsers({
            pageNumber,
            limit,
            search,
            showDeleted,
        });

        return Response.json(result, { status: 200 });

    } catch (error) {
        console.error("Error fetching users:", error);
        return Response.json(
            { error: getServiceErrorMessage(error, "Failed to fetch users") },
            { status: getServiceErrorStatus(error) }
        );
    }
}

// POST - Create new user (requires users.create)
export async function POST(request: NextRequest) {
    try {
        await connect();
        await requirePermission(request, "users.create");

        const { username, password, role, fullname } = await request.json();
        const currentUserId = await getUserFromCookie(request);
        const userResponse = await createUser({
            username,
            password,
            role,
            fullname,
            performedById: currentUserId,
            request,
        });

        return Response.json({
            message: "User created successfully",
            user: userResponse
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating user:", error);
        return Response.json(
            { error: getServiceErrorMessage(error, "Failed to create user") },
            { status: getServiceErrorStatus(error) }
        );
    }
}