import EntityDocument from "@/models/entityDocuments";
import Entity from "@/models/entities";
import DocumentTemplate from "@/models/documentTemplates";
import calculateStatus from "@/utils/calculateStatus";
import { PAGINATION } from "@/config/pagination";

type DocumentInput = {
  documentTemplate?: string;
  name?: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
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
      documentTemplate: doc?.documentTemplate,
      issueDate: doc?.issueDate,
      expiryDate: doc?.expiryDate,
      notes: doc?.notes,
    }))
  );
}

export async function listEntityDocuments(entityId: string) {
  const rows = await EntityDocument.find({ entity: entityId })
    .populate("documentTemplate", "name")
    .select("documentTemplate issueDate expiryDate notes");

  return rows.map((row: any) => ({
    _id: row._id,
    documentTemplate: row.documentTemplate?._id || row.documentTemplate,
    name: row.documentTemplate?.name || "",
    issueDate: row.issueDate,
    expiryDate: row.expiryDate,
    notes: row.notes,
  }));
}

export async function createEntityDocument(entityId: string, payload: DocumentInput) {
  return EntityDocument.create({
    entity: entityId,
    documentTemplate: payload?.documentTemplate,
    issueDate: payload?.issueDate,
    expiryDate: payload?.expiryDate,
    notes: payload?.notes,
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
      ...(payload.documentTemplate !== undefined
        ? { documentTemplate: payload.documentTemplate }
        : {}),
      ...(payload.issueDate !== undefined ? { issueDate: payload.issueDate } : {}),
      ...(payload.expiryDate !== undefined ? { expiryDate: payload.expiryDate } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
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
      .populate("documentTemplate", "name")
      .select("entity documentTemplate issueDate expiryDate notes")
      .sort({ expiryDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(normalizedLimit),
    EntityDocument.countDocuments({}),
  ]);

  const entityIds = documents
    .map((doc) => doc.entity?.toString())
    .filter((id): id is string => Boolean(id));
  const entities = await Entity.find({ _id: { $in: entityIds } }).select(
    "name entityType color"
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
      documentTemplate: doc.documentTemplate?._id || doc.documentTemplate,
      name: doc.documentTemplate?.name || "",
      issueDate: doc.issueDate,
      expiryDate: doc.expiryDate,
      notes: doc.notes,
      status,
      daysLeft: calculateDaysLeft(doc.expiryDate),
      entity: {
        id: doc.entity,
        name: entity?.name || "Unknown",
        entityType: entity?.entityType || "unknown",
        color: entity?.color,
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

export async function listDocumentTemplateOptions() {
  const rows = await DocumentTemplate.find({}).select("name").sort({ name: 1 });
  return rows.map((row: any) => ({
    id: row._id.toString(),
    label: row.name,
    name: row.name,
  }));
}
