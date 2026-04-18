import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requireAnyPermission } from "@/auth/guards";
import PaymentParticularTemplate from "@/models/paymentParticularTemplates";

const ALLOWED_CATEGORIES = new Set([
  "office_records",
  "liability_in",
  "liability_out",
  "instant_profit",
  "income",
  "expense",
]);

const SORT_FIELDS = new Set(["updatedAt", "createdAt", "particular", "category", "published"]);

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requireAnyPermission(request, ["payments.read", "payments.write"]);

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(0, Number(searchParams.get("page") || 0));
    const limit = Math.min(100, Math.max(5, Number(searchParams.get("limit") || 20)));
    const q = String(searchParams.get("q") || "").trim();
    const category = String(searchParams.get("category") || "").trim().toLowerCase();
    const categoriesRaw = String(searchParams.get("categories") || "").trim().toLowerCase();
    const published = String(searchParams.get("published") || "all").trim().toLowerCase();
    const sortRaw = String(searchParams.get("sort") || "updatedAt");
    const sort = SORT_FIELDS.has(sortRaw) ? sortRaw : "updatedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const skip = page * limit;

    const query: Record<string, any> = {};

    const categories = categoriesRaw
      .split(",")
      .map((item) => item.trim())
      .filter((item) => ALLOWED_CATEGORIES.has(item));

    if (categories.length > 0) {
      query.category = { $in: categories };
    } else if (category && ALLOWED_CATEGORIES.has(category)) {
      query.category = category;
    }

    if (published === "published") {
      query.published = true;
    } else if (published === "unpublished") {
      query.published = false;
    }

    if (q) {
      query.particular = { $regex: q, $options: "i" };
    }

    const [suggestions, total] = await Promise.all([
      PaymentParticularTemplate.find(query)
        .select("_id particular category published createdAt updatedAt")
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      PaymentParticularTemplate.countDocuments(query),
    ]);

    return Response.json(
      {
        suggestions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to fetch suggestions" },
      { status: error?.status || 500 }
    );
  }
}
