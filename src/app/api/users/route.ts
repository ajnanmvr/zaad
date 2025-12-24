import connect from "@/db/mongo";
import { isPartner } from "@/helpers/isAuthenticated";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { NextRequest } from "next/server";
import { UserService } from "@/services/user.service";

// GET - List all users (partners only)
export async function GET(request: NextRequest) {
    try {
        await connect();
        await isPartner(request);

        const searchParams = request.nextUrl.searchParams;
        const pageNumber = parseInt(searchParams.get("page") || "0");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const showDeleted = searchParams.get("deleted") === "true";
        const result = await UserService.listUsers(search, pageNumber, limit, showDeleted);
        return Response.json(result, { status: 200 });

    } catch (error) {
        console.error("Error fetching users:", error);
        return Response.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

// POST - Create new user (partners only)
export async function POST(request: NextRequest) {
    try {
        await connect();
        await isPartner(request);

        const { username, password, role, fullname } = await request.json();
        const currentUserId = await getUserFromCookie(request);
        const user = await UserService.createUser({ username, password, role, fullname }, currentUserId, request);
        return Response.json({
            message: "User created successfully",
            user,
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating user:", error);
        return Response.json(
            { error: (error as any).message || "Failed to create user" },
            { status: 400 }
        );
    }
}