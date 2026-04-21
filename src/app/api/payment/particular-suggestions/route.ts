import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requireAnyPermission, requirePermission } from "@/auth/guards";
import PaymentParticularTemplate from "@/models/paymentParticularTemplates";

type ParticularCategory =
  | "office_records"
  | "liability_in"
  | "liability_out"
  | "instant_profit"
  | "income"
  | "expense";

const ALLOWED_CATEGORIES = new Set<ParticularCategory>([
  "office_records",
  "liability_in",
  "liability_out",
  "instant_profit",
  "income",
  "expense",
]);

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeCategory(raw: unknown): ParticularCategory {
  const value = String(raw || "").trim().toLowerCase() as ParticularCategory;
  return ALLOWED_CATEGORIES.has(value) ? value : "office_records";
}

function normalizeCategories(raw: unknown): ParticularCategory[] {
  if (!Array.isArray(raw)) return [];

  const normalized = raw
    .map((value: unknown) => String(value || "").trim().toLowerCase())
    .filter((value: string): value is ParticularCategory => ALLOWED_CATEGORIES.has(value as ParticularCategory));

  return Array.from(new Set(normalized));
}

function buildRecordCategoryFilter(category: ParticularCategory) {
  switch (category) {
    case "liability_in":
      return { type: "income", recordKind: "liability" };
    case "liability_out":
      return { type: "expense", recordKind: "liability" };
    case "instant_profit":
      return { recordKind: "instant_profit" };
    case "income":
      return { type: "income" };
    case "expense":
      return { type: "expense" };
    case "office_records":
    default:
      return { recordKind: "office_records" };
  }
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requireAnyPermission(request, ["payments.read", "payments.write"]);

    const searchParams = request.nextUrl.searchParams;
    const q = String(searchParams.get("q") || "").trim();
    const category = normalizeCategory(searchParams.get("category"));

    if (q.length < 1) {
      return Response.json({ suggestions: [] }, { status: 200 });
    }

    const regex = new RegExp(escapeRegex(q), "i");
    const recordFilter: Record<string, any> = {
      deletedAt: null,
      particular: { $regex: regex },
      ...buildRecordCategoryFilter(category),
    };

    const templateRows = await PaymentParticularTemplate.find({
      published: true,
      category,
      particular: { $regex: regex },
    })
      .select("particular")
      .sort({ updatedAt: -1 })
      .limit(12)
      .lean();

    const unique = new Set<string>();

    for (const row of templateRows as any[]) {
      const value = String(row?.particular || "").trim();
      if (value) unique.add(value);
    }

    return Response.json({ suggestions: Array.from(unique).slice(0, 12) }, { status: 200 });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to fetch particular suggestions", suggestions: [] },
      { status: error?.status || 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.manage.particular-suggestions");

    const body = await request.json();
    const particular = String(body?.particular || "").trim();
    const categories = normalizeCategories(body?.categories);
    const nextCategories = categories.length > 0 ? categories : [normalizeCategory(body?.category)];

    if (!particular) {
      return Response.json({ error: "Particular is required" }, { status: 400 });
    }

    const existing = await PaymentParticularTemplate.findOne({ particular });

    if (existing) {
      const currentCategoriesRaw = Array.isArray(existing.category)
        ? existing.category
        : [String((existing as any).category || "").trim().toLowerCase()];
      const currentCategories = currentCategoriesRaw
        .map((value: unknown) => String(value || "").trim().toLowerCase())
        .filter((value: string): value is ParticularCategory => ALLOWED_CATEGORIES.has(value as ParticularCategory));

      existing.category = Array.from(new Set([...currentCategories, ...nextCategories]));
      if (existing.published === false) {
        existing.published = true;
      }
      await existing.save();

      return Response.json({ message: "Suggestion already exists", updated: true }, { status: 200 });
    }

    await PaymentParticularTemplate.create({ particular, category: nextCategories, published: true });

    return Response.json({ message: "Suggestion saved" }, { status: 201 });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to save particular suggestion" },
      { status: error?.status || 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.manage.particular-suggestions");

    const body = await request.json();
    const id = String(body?.id || "").trim();

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    const result = await PaymentParticularTemplate.findByIdAndDelete(id);

    if (!result) {
      return Response.json({ error: "Suggestion not found" }, { status: 404 });
    }

    return Response.json({ message: "Suggestion deleted" }, { status: 200 });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to delete particular suggestion" },
      { status: error?.status || 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.manage.particular-suggestions");

    const body = await request.json();
    const id = String(body?.id || "").trim();
    const published = body?.published;
    const particularRaw = body?.particular;
    const categoryRaw = body?.category;
    const categoriesRaw = body?.categories;

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    const updates: Record<string, any> = {};

    if (typeof published === "boolean") {
      updates.published = published;
    }

    if (typeof particularRaw !== "undefined") {
      const particular = String(particularRaw || "").trim();
      if (!particular) {
        return Response.json({ error: "Particular is required" }, { status: 400 });
      }
      updates.particular = particular;
    }

    if (typeof categoriesRaw !== "undefined") {
      const categories = normalizeCategories(categoriesRaw);
      updates.category = categories.length > 0 ? categories : ["office_records"];
    } else if (typeof categoryRaw !== "undefined") {
      updates.category = [normalizeCategory(categoryRaw)];
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "No updates provided" }, { status: 400 });
    }

    const current = await PaymentParticularTemplate.findById(id).lean<any>();
    if (!current) {
      return Response.json({ error: "Suggestion not found" }, { status: 404 });
    }

    const nextParticular = updates.particular ?? current.particular;
    if (typeof updates.particular !== "undefined") {
      const duplicate = await PaymentParticularTemplate.findOne({
        _id: { $ne: id },
        particular: nextParticular,
      }).lean();

      if (duplicate) {
        return Response.json({ error: "A suggestion with this particular already exists" }, { status: 409 });
      }
    }

    const result = await PaymentParticularTemplate.findByIdAndUpdate(
      id,
      updates,
      { new: true },
    );

    if (!result) {
      return Response.json({ error: "Suggestion not found" }, { status: 404 });
    }

    return Response.json({ message: "Suggestion updated", data: result }, { status: 200 });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to update particular suggestion" },
      { status: error?.status || 500 },
    );
  }
}
