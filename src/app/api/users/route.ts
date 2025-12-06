import connect from "@/db/mongo";
import User from "@/models/users";
import bcryptjs from "bcryptjs";
import { isPartner } from "@/helpers/isAuthenticated";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { logUserActivity } from "@/helpers/userActivityLogger";
import { NextRequest } from "next/server";

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

        // Build search query - show active or deleted users
        const query: any = { published: !showDeleted };
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: "i" } },
                { fullname: { $regex: search, $options: "i" } }
            ];
        }

        // Get total count
        const total = await User.countDocuments(query);

        // Get users with pagination
        const users = await User.find(query)
            .select("username fullname role createdAt updatedAt deletedAt")
            .sort({ createdAt: -1 })
            .skip(pageNumber * limit)
            .limit(limit);

        return Response.json({
            users,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(total / limit),
                totalUsers: total,
                hasMore: (pageNumber + 1) * limit < total
            },
            showingDeleted: showDeleted
        }, { status: 200 });

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

        // Validate required fields
        if (!username || !password) {
            return Response.json(
                { error: "Username and password are required" },
                { status: 400 }
            );
        }

        // Validate password length
        if (password.length < 6) {
            return Response.json(
                { error: "Password must be at least 6 characters long" },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username, published: true });
        if (existingUser) {
            return Response.json(
                { error: "Username already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        // Create new user
        const newUser = new User({
            username,
            password: hashedPassword,
            role: role || "employee",
            fullname: fullname || ""
        });

        const savedUser = await newUser.save();

        // Log activity
        const currentUserId = await getUserFromCookie(request);
        await logUserActivity({
            targetUserId: savedUser._id.toString(),
            performedById: currentUserId,
            action: "create",
            newValues: {
                username: savedUser.username,
                role: savedUser.role,
                fullname: savedUser.fullname
            },
            request
        });

        // Return user without password
        const userResponse = {
            _id: savedUser._id,
            username: savedUser.username,
            fullname: savedUser.fullname,
            role: savedUser.role,
            createdAt: savedUser.createdAt
        };

        return Response.json({
            message: "User created successfully",
            user: userResponse
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating user:", error);
        return Response.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}