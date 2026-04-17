import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requireAnyPermission, requirePermission } from "@/auth/guards";
import PaymentExpenseCategory from "@/models/paymentExpenseCategories";

const DEFAULT_COMPANY_EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Bills",
  "Office Supplies",
  "Maintenance",
  "Transport",
  "Internet",
  "Payroll",
  "Insurance",
  "Miscellaneous",
];

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requireAnyPermission(request, ["payments.read", "payments.write"]);

    const rows = await PaymentExpenseCategory.find({ published: true })
      .select("name")
      .sort({ name: 1 })
      .lean();

    const merged = new Set<string>(DEFAULT_COMPANY_EXPENSE_CATEGORIES);
    rows.forEach((row: any) => {
      const name = String(row?.name || "").trim();
      if (name) {
        merged.add(name);
      }
    });

    return Response.json(
      {
        categories: Array.from(merged).sort((a, b) => a.localeCompare(b)),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return Response.json(
      {
        error: error?.message || "Failed to fetch expense categories",
        categories: DEFAULT_COMPANY_EXPENSE_CATEGORIES,
      },
      { status: error?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.write");

    const body = await request.json();
    const name = String(body?.name || "").trim();

    if (!name) {
      return Response.json({ error: "Category name is required" }, { status: 400 });
    }

    const existing = await PaymentExpenseCategory.findOne({ name });
    if (existing) {
      if (existing.published === false) {
        existing.published = true;
        await existing.save();
      }

      return Response.json(
        {
          category: { id: existing._id.toString(), name: existing.name },
        },
        { status: 200 }
      );
    }

    const created = await PaymentExpenseCategory.create({ name, published: true });

    return Response.json(
      { category: { id: created._id.toString(), name: created.name } },
      { status: 201 }
    );
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to create expense category" },
      { status: error?.status || 500 }
    );
  }
}
