import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requireAnyPermission, requirePermission } from "@/auth/guards";
import Records from "@/models/records";
import PaymentParticularTemplate from "@/models/paymentParticularTemplates";

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requireAnyPermission(request, ["payments.read", "payments.write"]);

    const searchParams = request.nextUrl.searchParams;
    const q = String(searchParams.get("q") || "").trim();
    const appliesTo = String(searchParams.get("type") || "").trim().toLowerCase();
    const entityType = String(searchParams.get("entityType") || "").trim().toLowerCase();
    const expenseCategory = String(searchParams.get("expenseCategory") || "").trim();

    if (q.length < 1) {
      return Response.json({ suggestions: [] }, { status: 200 });
    }

    const regex = new RegExp(escapeRegex(q), "i");
    const recordFilter: Record<string, any> = {
      published: true,
      particular: { $regex: regex },
    };

    if (appliesTo === "income" || appliesTo === "expense") {
      recordFilter.type = appliesTo;
    }
    if (entityType) {
      if (entityType === "company") {
        recordFilter.$or = [{ entityType: "company" }, { company: { $ne: null } }];
      } else if (entityType === "employee" || entityType === "individual") {
        recordFilter.$or = [
          { entityType },
          { entityType: { $exists: false }, employee: { $ne: null } },
        ];
      } else if (entityType === "self") {
        recordFilter.$or = [{ entityType: "self" }, { self: { $ne: null } }];
      }
    }
    if (expenseCategory) {
      recordFilter.expenseCategory = expenseCategory;
    }

    const [templateRows, recordRows] = await Promise.all([
      PaymentParticularTemplate.find({
        published: true,
        particular: { $regex: regex },
        appliesTo:
          appliesTo === "income" || appliesTo === "expense"
            ? { $in: ["both", appliesTo] }
            : { $in: ["income", "expense", "both"] },
        ...(entityType ? { entityType: { $in: ["", entityType] } } : {}),
        ...(expenseCategory ? { expenseCategory: { $in: ["", expenseCategory] } } : {}),
      })
        .select("particular")
        .sort({ updatedAt: -1 })
        .limit(12)
        .lean(),
      Records.find(recordFilter)
        .select("particular")
        .sort({ updatedAt: -1 })
        .limit(24)
        .lean(),
    ]);

    const unique = new Set<string>();

    for (const row of templateRows as any[]) {
      const value = String(row?.particular || "").trim();
      if (value) unique.add(value);
    }

    for (const row of recordRows as any[]) {
      const value = String(row?.particular || "").trim();
      if (value) unique.add(value);
    }

    const suggestions = Array.from(unique).slice(0, 12);
    return Response.json({ suggestions }, { status: 200 });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to fetch particular suggestions", suggestions: [] },
      { status: error?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.write");

    const body = await request.json();
    const particular = String(body?.particular || "").trim();
    const appliesTo = String(body?.appliesTo || "both").trim().toLowerCase();
    const entityType = String(body?.entityType || "").trim().toLowerCase();
    const expenseCategory = String(body?.expenseCategory || "").trim();

    if (!particular) {
      return Response.json({ error: "Particular is required" }, { status: 400 });
    }

    const normalizedAppliesTo =
      appliesTo === "income" || appliesTo === "expense" || appliesTo === "both"
        ? appliesTo
        : "both";

    const normalizedEntityType = ["company", "employee", "individual", "self"].includes(entityType)
      ? entityType
      : "";

    const existing = await PaymentParticularTemplate.findOne({
      particular,
      appliesTo: normalizedAppliesTo,
      entityType: normalizedEntityType,
      expenseCategory,
    });

    if (existing) {
      if (existing.published === false) {
        existing.published = true;
        await existing.save();
      }
      return Response.json({ message: "Suggestion already exists" }, { status: 200 });
    }

    await PaymentParticularTemplate.create({
      particular,
      appliesTo: normalizedAppliesTo,
      entityType: normalizedEntityType,
      expenseCategory,
      published: true,
    });

    return Response.json({ message: "Suggestion saved" }, { status: 201 });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to save particular suggestion" },
      { status: error?.status || 500 }
    );
  }
}
