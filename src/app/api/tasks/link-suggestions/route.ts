import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requireAnyPermission } from "@/auth/guards";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import { Company, Employee, Individual } from "@/models/entities";

type Suggestion = {
  id: string;
  label: string;
  subtitle?: string;
};

const DEFAULT_LIMIT = 8;
const ALLOWED_LINK_TYPES = new Set(["company", "employee", "individual"]);

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requireAnyPermission(request, ["tasks.read", "tasks.manage", "tasks.complete"]);

    const targetType = String(request.nextUrl.searchParams.get("targetType") || "")
      .trim()
      .toLowerCase();
    const q = String(request.nextUrl.searchParams.get("q") || "").trim();

    if (!targetType || !ALLOWED_LINK_TYPES.has(targetType) || q.length < 2) {
      return Response.json({ items: [] }, { status: 200 });
    }

    const regex = new RegExp(escapeRegex(q), "i");

    if (targetType === "company") {
      const rows = await Company.find({ name: { $regex: regex }, published: true })
        .select("name")
        .limit(DEFAULT_LIMIT)
        .lean();

      const items: Suggestion[] = rows.map((row: any) => ({
        id: row._id.toString(),
        label: row.name,
        subtitle: "Company",
      }));

      return Response.json({ items }, { status: 200 });
    }

    if (targetType === "employee") {
      const rows = await Employee.find({ name: { $regex: regex }, published: true })
        .select("name")
        .limit(DEFAULT_LIMIT)
        .lean();

      const items: Suggestion[] = rows.map((row: any) => ({
        id: row._id.toString(),
        label: row.name,
        subtitle: "Employee",
      }));

      return Response.json({ items }, { status: 200 });
    }

    if (targetType === "individual") {
      const rows = await Individual.find({ name: { $regex: regex }, published: true })
        .select("name")
        .limit(DEFAULT_LIMIT)
        .lean();

      const items: Suggestion[] = rows.map((row: any) => ({
        id: row._id.toString(),
        label: row.name,
        subtitle: "Individual",
      }));

      return Response.json({ items }, { status: 200 });
    }

    return Response.json({ items: [] }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to fetch linked target suggestions") },
      { status: getServiceErrorStatus(error) },
    );
  }
}
