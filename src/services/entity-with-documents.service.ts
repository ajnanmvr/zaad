import processDocuments from "@/helpers/processDocuments";
import calculateStatus from "@/utils/calculateStatus";
import {
  findDocumentIndex,
  formatDocuments,
  updateDocumentFields,
} from "@/utils/document.utils";
import { serializeObjectIds } from "@/utils/serialization";
import connect from "@/db/mongo";

export interface SummaryListItem {
  id: string;
  name: string;
  expiryDate: string;
  docs: number;
  status: string;
  [key: string]: any;
}

/**
 * Sort summary data by expiry date
 */
export const sortByExpiryDate = (data: SummaryListItem[]): SummaryListItem[] => {
  return data.sort((a, b) =>
    a.expiryDate === "---"
      ? 1
      : b.expiryDate === "---"
      ? -1
      : new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  );
};

/**
 * Process entity summary for list view
 */
export const processSummaryItem = (
  entity: any,
  additionalFields: Record<string, any> = {}
): SummaryListItem => {
  const { expiryDate, docsCount } = processDocuments(entity.documents);
  const status = calculateStatus(expiryDate);

  return {
    id: entity._id?.toString() || entity._id,
    name: entity.name,
    expiryDate,
    docs: docsCount,
    status,
    ...serializeObjectIds(additionalFields),
  };
};

/**
 * Process summary list
 */
export const processSummaryList = (
  entities: any[],
  additionalFieldsMap: (entity: any) => Record<string, any> = () => ({})
): { count: number; data: SummaryListItem[] } => {
  const data = entities.map((entity) =>
    processSummaryItem(entity, additionalFieldsMap(entity))
  );
  return {
    count: entities.length,
    data: sortByExpiryDate(data),
  };
};

/**
 * Service base for entities with documents
 */
export abstract class EntityWithDocumentsService {
  protected repository: any;

  constructor(repository: any) {
    this.repository = repository;
  }

  /**
   * Create entity
   */
  async create(data: any) {
    await connect();
    return this.repository.create(data);
  }

  /**
   * Get entity by ID
   */
  async getById(id: string) {
    await connect();
    return this.repository.findById(id);
  }

  /**
   * Update entity
   */
  async updateEntity(id: string, data: any) {
    await connect();
    return this.repository.updateById(id, data);
  }

  /**
   * Delete entity
   */
  async deleteEntity(id: string) {
    await connect();
    return this.repository.softDelete(id);
  }

  /**
   * Add document to entity
   */
  async addDocument(id: string, document: any, fetchMethod: string = "findByIdForUpdate") {
    await connect();
    const entity = await this.repository[fetchMethod](id);
    if (!entity) return null;
    entity.documents.push(document);
    await entity.save();
    return this.serializeEntity(entity.toObject());
  }

  /**
   * Update document in entity
   */
  async updateDocument(
    id: string,
    docId: string,
    fields: any,
    fetchMethod: string = "findByIdForUpdate"
  ) {
    await connect();
    const entity = await this.repository[fetchMethod](id);
    if (!entity) return { entity: null, documentIndex: null };

    const documentIndex = findDocumentIndex(entity.documents, docId);
    if (documentIndex === -1) return { entity: null, documentIndex: null };

    updateDocumentFields(entity.documents[documentIndex], fields);
    await entity.save();

    return { entity: this.serializeEntity(entity.toObject()), documentIndex };
  }

  /**
   * Delete document from entity
   */
  async deleteDocument(id: string, docId: string, fetchMethod: string = "findByIdForUpdate") {
    await connect();
    const entity = await this.repository[fetchMethod](id);
    if (!entity) return { entity: null, documentIndex: null };

    const documentIndex = findDocumentIndex(entity.documents, docId);
    if (documentIndex === -1) return { entity: null, documentIndex: null };

    entity.documents.splice(documentIndex, 1);
    await entity.save();

    return { entity: this.serializeEntity(entity.toObject()), documentIndex };
  }

  /**
   * Format entity details with processed documents
   */
  protected formatEntityDetails(entity: any, fieldsMap: Record<string, any>) {
    const modifiedDocuments = formatDocuments(entity.documents);
    
    // Serialize all values in fieldsMap to convert ObjectIds to strings
    const serializedFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(fieldsMap)) {
      serializedFields[key] = serializeObjectIds(value);
    }

    return {
      id: entity._id?.toString?.() || entity._id,
      ...serializedFields,
      documents: modifiedDocuments,
    };
  }

  /**
   * Serialize entire entity to convert all ObjectIds to strings
   */
  private serializeEntity(entity: any): any {
    return serializeObjectIds(entity);
  }
}
