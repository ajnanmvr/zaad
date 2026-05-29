import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requireAnyPermission } from "@/auth/guards";
import User from "@/models/users";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requireAnyPermission(request, ["tasks.assign", "tasks.manage"]);

    const users = await User.find({ published: true })
      .select("username fullname role")
      .sort({ username: 1 });

    return Response.json({ users }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to fetch assignees") },
      { status: getServiceErrorStatus(error) },
    );
  }
}

