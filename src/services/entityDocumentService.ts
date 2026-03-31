import EntityDocument from "@/models/entityDocuments";
import Entity from "@/models/entities";
import calculateStatus from "@/utils/calculateStatus";
import { PAGINATION } from "@/config/pagination";

type DocumentInput = {
  name?: string;
  issueDate?: string;
  expiryDate?: string;
  attachment?: string;
};

function calculateDaysLeft(expiryDate?: string) {
  if (!expiryDate) {
    return null;
  }

  const expiry = new Date(expiryDate).getTime();
  if (Number.isNaN(expiry)) {
    return null;
  }

  const today = new Date().getTime();
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

export async function replaceEntityDocuments(entityId: string, documents: DocumentInput[]) {
  await EntityDocument.deleteMany({ entity: entityId });
  if (!documents.length) {
    return;
  }

  await EntityDocument.insertMany(
    documents.map((doc) => ({
      entity: entityId,
      name: doc?.name,
      issueDate: doc?.issueDate,
      expiryDate: doc?.expiryDate,
      attachment: doc?.attachment,
    }))
  );
}

export async function listEntityDocuments(entityId: string) {
  return EntityDocument.find({ entity: entityId }).select(
    "name issueDate expiryDate attachment"
  );
}

export async function createEntityDocument(entityId: string, payload: DocumentInput) {
  return EntityDocument.create({
    entity: entityId,
    name: payload?.name,
    issueDate: payload?.issueDate,
    expiryDate: payload?.expiryDate,
    attachment: payload?.attachment,
  });
}

export async function updateEntityDocument(
  entityId: string,
  documentId: string,
  payload: DocumentInput
) {
  return EntityDocument.findOneAndUpdate(
    { _id: documentId, entity: entityId },
    {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.issueDate !== undefined ? { issueDate: payload.issueDate } : {}),
      ...(payload.expiryDate !== undefined ? { expiryDate: payload.expiryDate } : {}),
      ...(payload.attachment !== undefined ? { attachment: payload.attachment } : {}),
    },
    { new: true }
  );
}

export async function deleteEntityDocument(entityId: string, documentId: string) {
  return EntityDocument.findOneAndDelete({ _id: documentId, entity: entityId });
}

export async function listExpiryDocuments(page: number, limit: number) {
  const normalizedPage = Math.max(page || PAGINATION.DEFAULT_PAGE, 1);
  const normalizedLimit = Math.max(
    limit || PAGINATION.LIMITS.EXPIRY_DOCUMENTS,
    1
  );
  const skip = (normalizedPage - 1) * normalizedLimit;

  const [documents, total] = await Promise.all([
    EntityDocument.find({})
      .select("entity name issueDate expiryDate attachment")
      .sort({ expiryDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(normalizedLimit),
    EntityDocument.countDocuments({}),
  ]);

  const entityIds = documents
    .map((doc) => doc.entity?.toString())
    .filter((id): id is string => Boolean(id));
  const entities = await Entity.find({ _id: { $in: entityIds } }).select(
    "name entityType"
  );

  const entityMap = new Map<string, any>();
  entities.forEach((entity: any) => {
    entityMap.set(entity._id.toString(), entity);
  });

  const data = documents.map((doc: any) => {
    const entity = entityMap.get(doc.entity.toString());
    const status = calculateStatus(doc.expiryDate);
    return {
      id: doc._id,
      name: doc.name,
      issueDate: doc.issueDate,
      expiryDate: doc.expiryDate,
      attachment: doc.attachment,
      status,
      daysLeft: calculateDaysLeft(doc.expiryDate),
      entity: {
        id: doc.entity,
        name: entity?.name || "Unknown",
        entityType: entity?.entityType || "unknown",
      },
    };
  });

  return {
    data,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: Math.ceil(total / normalizedLimit),
    },
  };
}
