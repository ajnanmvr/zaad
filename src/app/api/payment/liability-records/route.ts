import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import Records from "@/models/records";
import { PAYMENT_POPULATE_FIELDS, mapRecordListItem } from "@/app/api/payment/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(Number(searchParams.get("page") || "0"), 0);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || "20"), 1), 100);
    const search = String(searchParams.get("search") || "").trim();
    const type = String(searchParams.get("type") || "").trim().toLowerCase();
    const method = String(searchParams.get("method") || "").trim().toLowerCase();
    const sort = String(searchParams.get("sort") || "newest").trim().toLowerCase();

    const query: Record<string, any> = {
      recordKind: "liability",
      deletedAt: null,
    };

    if (search) {
      query.$or = [
        { particular: { $regex: search, $options: "i" } },
        { remarks: { $regex: search, $options: "i" } },
      ];
    }

    const baseRecords = await Records.find(query)
        .populate(PAYMENT_POPULATE_FIELDS)
        .sort({ createdAt: -1 })
        .lean();

    const mappedRows = baseRecords.map(mapRecordListItem);

    const filteredRows = mappedRows.filter((row: any) => {
      const typeMatch = !type || row.type === type;
      const methodMatch = !method || String(row.method || "").toLowerCase() === method;
      const searchMatch =
        !search ||
        [
          `${row.suffix || ""}${row.number || ""}`,
          row.particular || "",
          row.client?.name || "",
          row.method || "",
          row.remarks || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());

      return typeMatch && methodMatch && searchMatch;
    });

    const sortedRows = [...filteredRows].sort((a: any, b: any) => {
      if (sort === "amount-desc") return Number(b.amount || 0) - Number(a.amount || 0);
      if (sort === "amount-asc") return Number(a.amount || 0) - Number(b.amount || 0);
      if (sort === "particular-asc") return String(a.particular || "").localeCompare(String(b.particular || ""));
      if (sort === "particular-desc") return String(b.particular || "").localeCompare(String(a.particular || ""));
      if (sort === "oldest") {
        return new Date(String(a.createdAt || 0)).getTime() - new Date(String(b.createdAt || 0)).getTime();
      }
      return new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime();
    });

    const total = sortedRows.length;
    const pagedRows = sortedRows.slice(page * limit, page * limit + limit);

    const groupedByEntity = filteredRows.reduce(
      (acc: Record<string, { income: number; expense: number }>, row: any) => {
        const entityName = String(row?.client?.name || "Unknown Entity");
        if (!acc[entityName]) {
          acc[entityName] = { income: 0, expense: 0 };
        }
        const amount = Number(row.amount || 0);
        if (row.type === "income") {
          acc[entityName].income += amount;
        } else {
          acc[entityName].expense += amount;
        }
        return acc;
      },
      {},
    );

    const entitySummary = Object.entries(groupedByEntity)
      .map(([entity, bucket]) => ({
        entity,
        income: Number(bucket.income.toFixed(2)),
        expense: Number(bucket.expense.toFixed(2)),
        net: Number((bucket.income - bucket.expense).toFixed(2)),
      }))
      .sort((a: any, b: any) => Math.abs(b.net) - Math.abs(a.net));

    const totals = entitySummary.reduce(
      (acc: any, row: any) => {
        acc.income += row.income;
        acc.expense += row.expense;
        acc.net += row.net;
        return acc;
      },
      { income: 0, expense: 0, net: 0 },
    );

    return Response.json(
      {
        records: pagedRows,
        summary: {
          entities: entitySummary,
          totals: {
            income: Number(totals.income.toFixed(2)),
            expense: Number(totals.expense.toFixed(2)),
            net: Number(totals.net.toFixed(2)),
          },
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: (page + 1) * limit < total,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to load liability records" },
      { status: 500 },
    );
  }
}
