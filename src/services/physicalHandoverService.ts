import PhysicalHandover from "@/models/physicalHandover";
import { PAGINATION } from "@/config/pagination";

function normalizePagination(page: number, limit: number) {
  const normalizedPage = Math.max(Number(page) || PAGINATION.DEFAULT_PAGE, 1);
  const normalizedLimit = Math.max(
    Number(limit) || PAGINATION.LIMITS.ENTITY_LIST,
    1
  );
  const skip = (normalizedPage - 1) * normalizedLimit;
  return { normalizedPage, normalizedLimit, skip };
}

export async function createHandover(data: any) {
  return PhysicalHandover.create(data);
}

export async function listHandovers(
  page: number,
  limit: number,
  search?: string,
  entityId?: string,
  status?: "pending" | "returned" | "all"
) {
  const { normalizedPage, normalizedLimit, skip } = normalizePagination(page, limit);
  
  let query: any = {};
  if (search) {
    query.documentName = { $regex: search, $options: "i" };
  }
  if (entityId) {
    query.entity = entityId;
  }
  if (status === "pending") {
    query.status = "received";
  } else if (status === "returned") {
    query.status = "returned";
  }

  const [handovers, total] = await Promise.all([
    PhysicalHandover.find(query)
      .populate("entity", "name entityType color")
      .populate("receivedBy", "username fullname")
      .populate("returnedBy", "username fullname")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(normalizedLimit),
    PhysicalHandover.countDocuments(query),
  ]);

  return {
    data: handovers.map((h: any) => ({
      id: h._id,
      entity: {
        id: h.entity?._id,
        name: h.entity?.name,
        type: h.entity?.entityType,
        color: h.entity?.color,
      },
      documentName: h.documentName,
      receivedAt: h.receivedAt,
      returnedAt: h.returnedAt,
      status: h.status,
      receiveNote: h.receiveNote || h.remarks,
      returnNote: h.returnNote,
      remarks: h.remarks,
      receivedBy: h.receivedBy ? {
        id: h.receivedBy._id,
        username: h.receivedBy.username,
        fullname: h.receivedBy.fullname,
      } : undefined,
      returnedBy: h.returnedBy ? {
        id: h.returnedBy._id,
        username: h.returnedBy.username,
        fullname: h.returnedBy.fullname,
      } : undefined,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
    })),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: Math.ceil(total / normalizedLimit),
    },
  };
}

export async function updateHandover(id: string, data: any) {
  return PhysicalHandover.findByIdAndUpdate(id, data, { new: true });
}

export async function returnHandover(id: string, returnedBy: string, returnNote?: string) {
  return PhysicalHandover.findByIdAndUpdate(
    id,
    {
      status: "returned",
      returnedAt: new Date(),
      returnedBy,
      ...(returnNote && { returnNote }),
    },
    { new: true }
  );
}

export async function deleteHandover(id: string) {
  return PhysicalHandover.findByIdAndDelete(id);
}
