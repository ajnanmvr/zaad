import Records from "@/models/records";
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  const principal = await requirePermission(request, "payments.write");
  const { id } = params;
  await Records.findByIdAndUpdate(id, {
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
        details: "Transaction moved to bin",
      },
    },
  });
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

  const data = await Records.findByIdAndUpdate(
    id,
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
          details: "Transaction recovered from bin",
        },
      },
    },
    { new: true }
  );

  if (!data) {
    return Response.json({ error: "Record not found" }, { status: 404 });
  }

  return Response.json({ message: "Record recovered", data }, { status: 200 });
}
