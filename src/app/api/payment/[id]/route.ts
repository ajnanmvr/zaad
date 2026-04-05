import Records from "@/models/records";
import TaskNotification from "@/models/taskNotifications";
import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";

function isAdminRole(role?: string) {
  const normalized = (role || "").toLowerCase();
  return normalized === "admin" || normalized === "superadmin";
}

function isObjectIdLike(value: any) {
  return (
    value &&
    typeof value === "object" &&
    (value._bsontype === "ObjectID" || value._bsontype === "ObjectId" || value.constructor?.name === "ObjectId")
  );
}

function normalizeForCompare(value: any): any {
  if (value === null || value === undefined) return null;

  if (isObjectIdLike(value)) {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const numeric = Number(trimmed);
    if (trimmed !== "" && Number.isFinite(numeric)) {
      return numeric;
    }
    const parsedDate = Date.parse(trimmed);
    if (!Number.isNaN(parsedDate) && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return parsedDate;
    }
    return trimmed;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeForCompare(item));
  }

  if (typeof value === "object") {
    const normalizedEntries = Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entryValue]) => [key, normalizeForCompare(entryValue)]);

    return Object.fromEntries(normalizedEntries);
  }

  return value;
}

function areValuesEqual(a: any, b: any) {
  return JSON.stringify(normalizeForCompare(a)) === JSON.stringify(normalizeForCompare(b));
}

async function resolveLinkedRecordIds(record: any, includeArchived = false) {
  if (!record?._id) {
    return [];
  }

  const recordId = String(record._id);
  const status = String(record.status || "").toLowerCase();
  const linkedIds = new Set<string>([recordId]);
  const publicationFilter = includeArchived ? {} : { published: true };

  if (status === "self deposit") {
    const partners = await Records.find({
      ...publicationFilter,
      status: "Self Deposit",
      self: "Zaad (Self Deposit)",
      createdBy: record.createdBy,
      suffix: record.suffix,
      amount: record.amount,
      _id: { $ne: record._id },
    }).select("_id");

    partners.forEach((partner) => linkedIds.add(String(partner._id)));
    return Array.from(linkedIds);
  }

  if (status === "profit") {
    const recordNumber = Number(record.number);

    if (record.type === "income" && String(record.method || "").toLowerCase() !== "service fee") {
      const partner = await Records.findOne({
        ...publicationFilter,
        status: "Profit",
        createdBy: record.createdBy,
        type: "expense",
        method: "service fee",
        serviceFee: record.amount,
        amount: 0,
        number: Number.isFinite(recordNumber) ? recordNumber + 1 : undefined,
        _id: { $ne: record._id },
      }).select("_id");

      if (partner) {
        linkedIds.add(String(partner._id));
      }
    }

    if (record.type === "expense" && String(record.method || "").toLowerCase() === "service fee") {
      const partner = await Records.findOne({
        ...publicationFilter,
        status: "Profit",
        createdBy: record.createdBy,
        type: "income",
        amount: record.serviceFee,
        number: Number.isFinite(recordNumber) ? recordNumber - 1 : undefined,
        _id: { $ne: record._id },
      }).select("_id");

      if (partner) {
        linkedIds.add(String(partner._id));
      }
    }
  }

  return Array.from(linkedIds);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  const principal = await requirePermission(request, "payments.write");
  const { id } = params;
  const record = await Records.findById(id);

  if (!record) {
    return Response.json({ error: "Record not found" }, { status: 404 });
  }

  const linkedIds = await resolveLinkedRecordIds(record);

  await Records.updateMany(
    { _id: { $in: linkedIds } },
    {
      published: false,
      deletedAt: new Date(),
      deletedBy: principal.userId,
      $push: {
        activityLog: {
          action: "delete",
          at: new Date(),
          by: principal.userId,
          byUsername: principal.username,
          byFullname: principal.fullname,
          details:
            linkedIds.length > 1
              ? "Linked transaction pair moved to bin"
              : "Transaction moved to bin",
        },
      },
    }
  );
  return Response.json({ message: "data deleted" }, { status: 200 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  await requirePermission(request, "payments.read");
  try {
    const { id } = params;
    const data = await Records.findById(id);
    return Response.json(data, { status: 200 });
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    const principal = await requirePermission(request, "payments.write");
    const { id } = params;
    const reqBody = await request.json();
    const {
      _id,
      __v,
      createdAt,
      updatedAt,
      createdBy,
      published,
      activityLog,
      deletedAt,
      deletedBy,
      ...safePayload
    } = reqBody || {};

    const existingRecord = await Records.findById(id).lean();

    if (!existingRecord) {
      return Response.json({ error: "Record not found" }, { status: 404 });
    }

    const changedEntries = Object.entries(safePayload).filter(([key, nextValue]) => {
      const currentValue = (existingRecord as any)[key];
      return !areValuesEqual(nextValue, currentValue);
    });

    const editedFields = changedEntries.map(([key]) => key);

    if (editedFields.length === 0) {
      return Response.json(
        { message: "No changes detected", data: existingRecord },
        { status: 200 }
      );
    }

    const changedPayload = Object.fromEntries(changedEntries);
    const previousValues = Object.fromEntries(
      changedEntries.map(([key]) => [key, (existingRecord as any)[key]])
    );
    const newValues = Object.fromEntries(
      changedEntries.map(([key, nextValue]) => [key, nextValue])
    );

    const data = await Records.findByIdAndUpdate(
      id,
      {
        ...changedPayload,
        edited: true,
        $push: {
          activityLog: {
            action: "update",
            at: new Date(),
            by: principal.userId,
            byUsername: principal.username,
            byFullname: principal.fullname,
            details: editedFields.length
              ? `Updated fields: ${editedFields.join(", ")}`
              : "Transaction updated",
            previousValues,
            newValues,
          },
        },
      },
      { new: true }
    );

    const creatorId = existingRecord.createdBy?.toString?.();
    if (data && creatorId && creatorId !== principal.userId) {
      await TaskNotification.create({
        user: creatorId,
        type: "payment_edited",
        title: "Payment record edited",
        message: `${principal.fullname || principal.username || "A user"} changed ${editedFields.length} field${editedFields.length === 1 ? "" : "s"} on ${(existingRecord as any).suffix || ""}${(existingRecord as any).number || ""}.`,
        createdBy: principal.userId,
        entityType: "payment",
        entityId: data._id,
      });
    }

    return Response.json({ message: "data updated", data }, { status: 200 });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to update payment record" },
      { status: error?.status || 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  const principal = await requirePermission(request, "payments.write");

  if (!isAdminRole(principal.role)) {
    return Response.json({ error: "Admin role required" }, { status: 403 });
  }

  const { id } = params;
  const reqBody = await request.json();

  if (reqBody?.action !== "recover") {
    return Response.json({ error: "Unsupported action" }, { status: 400 });
  }

  const record = await Records.findById(id);

  if (!record) {
    return Response.json({ error: "Record not found" }, { status: 404 });
  }

  const linkedIds = await resolveLinkedRecordIds(record, true);

  const data = await Records.updateMany(
    { _id: { $in: linkedIds } },
    {
      published: true,
      deletedAt: null,
      deletedBy: null,
      $push: {
        activityLog: {
          action: "recover",
          at: new Date(),
          by: principal.userId,
          byUsername: principal.username,
          byFullname: principal.fullname,
          details:
            linkedIds.length > 1
              ? "Linked transaction pair recovered from bin"
              : "Transaction recovered from bin",
        },
      },
    }
  );

  return Response.json({ message: "Record recovered", data }, { status: 200 });
}
