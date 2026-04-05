import connect from "@/db/mongo";
import Invoice from "@/models/invoice";
import Entity from "@/models/entities";
import { TInvoiceItemsData } from "@/types/invoice";
import formatDate from "@/utils/formatDate";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connect();
    const reqBody = await request.json();
    const hasEntityId = Boolean(reqBody?.entityId);
    const hasEntityType = Boolean(reqBody?.entityType);

    if (hasEntityId !== hasEntityType) {
      return Response.json(
        {
          message:
            "Connected invoices must include both entityId and entityType, or neither for detached invoices.",
        },
        { status: 400 }
      );
    }

    const data = await Invoice.create(reqBody);
    return Response.json(
      { message: "Created new payment invoice", data },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    const searchParams = request.nextUrl.searchParams;
    const pageNumber = searchParams.get("page") || 0;
    const contentPerSection = 10;

    // Extract the single search parameter
    const search = searchParams.get("search");
    const entityId = searchParams.get("entityId");

    // Build the query object
    const query: any = { published: true };
    if (entityId) {
      query.entityId = entityId;
    }

    if (search) {
      const formattedDate = formatDate(new Date(search));
      const numericInvoiceNo = Number(search);
      const orConditions: any[] = [
        { client: { $regex: search, $options: "i" } },
        { purpose: { $regex: search, $options: "i" } },
        { date: { $regex: search, $options: "i" } },
      ];

      if (formattedDate !== "---") {
        orConditions.push({ date: { $regex: formattedDate, $options: "i" } });
      }

      if (!Number.isNaN(numericInvoiceNo) && search.trim() !== "") {
        orConditions.push({ invoiceNo: numericInvoiceNo });
      }

      query.$or = [
        ...orConditions,
      ];
    }

    const invoice = await Invoice.find(query)
      .populate("createdBy")
      .skip(+pageNumber * contentPerSection)
      .limit(contentPerSection + 1)
      .sort({ createdAt: -1 });

    if (!invoice || invoice.length === 0) {
      return Response.json(
        {
          message: "No invoice found",
          count: 0,
          hasMore: false,
          invoices: [],
          records: [],
        },
        { status: 200 }
      );
    }

    const hasMore = invoice.length > contentPerSection;
    const pageRows = invoice.slice(0, contentPerSection);

    const entityIds = pageRows
      .map((row) => row.entityId)
      .filter((value): value is any => Boolean(value));

    const entities = entityIds.length
      ? await Entity.find({ _id: { $in: entityIds } }).select("_id name color").lean()
      : [];

    const entityMap = entities.reduce<Record<string, { name?: string; color?: string }>>((acc, entity: any) => {
      acc[String(entity._id)] = { name: entity.name, color: entity.color };
      return acc;
    }, {});

    const transformedData = pageRows.map((invoice) => {
        const entityKey = invoice.entityId ? String(invoice.entityId) : "";
        const entityMeta = entityKey ? entityMap[entityKey] : undefined;

        return {
          id: invoice._id,
          client: invoice.client,
          entityId: invoice.entityId || null,
          entityType: invoice.entityType || null,
          entityColor: entityMeta?.color || null,
          entityName: entityMeta?.name || invoice.client || null,
          purpose: invoice.purpose,
          invoiceNo: invoice.suffix + invoice.invoiceNo,
          amount: invoice.items.reduce(
            (acc: number, item: TInvoiceItemsData) =>
              acc + item.rate * item.quantity,
            0
          ),
          date: formatDate(invoice.date),
        };
      });
    return Response.json(
      { hasMore, count: transformedData.length, invoices: transformedData, records: transformedData },
      { status: 200 }
    );
  } catch (error) {
    return Response.json({ error }, { status: 401 });
  }
}
