import processDocuments from "@/helpers/processDocuments";
import calculateStatus from "@/utils/calculateStatus";
import {
  findDocumentIndex,
  formatDocuments,
  updateDocumentFields,
} from "@/utils/document.utils";

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
    id: entity._id,
    name: entity.name,
    expiryDate,
    docs: docsCount,
    status,
    ...additionalFields,
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
    return this.repository.create(data);
  }

  /**
   * Get entity by ID
   */
  async getById(id: string) {
    return this.repository.findById(id);
  }

  /**
   * Update entity
   */
  async updateEntity(id: string, data: any) {
    return this.repository.updateById(id, data);
  }

  /**
   * Delete entity
   */
  async deleteEntity(id: string) {
    return this.repository.softDelete(id);
  }

  /**
   * Add document to entity
   */
  async addDocument(id: string, document: any, fetchMethod: string = "findById") {
    const entity = await this.repository[fetchMethod](id);
    if (!entity) return null;
    entity.documents.push(document);
    await entity.save();
    return entity;
  }

  /**
   * Update document in entity
   */
  async updateDocument(
    id: string,
    docId: string,
    fields: any,
    fetchMethod: string = "findById"
  ) {
    const entity = await this.repository[fetchMethod](id);
    if (!entity) return { documentIndex: null };

    const documentIndex = findDocumentIndex(entity.documents, docId);
    if (documentIndex === -1) return { documentIndex: null };

    updateDocumentFields(entity.documents[documentIndex], fields);
    await entity.save();

    return { documentIndex };
  }

  /**
   * Delete document from entity
   */
  async deleteDocument(id: string, docId: string, fetchMethod: string = "findById") {
    const entity = await this.repository[fetchMethod](id);
    if (!entity) return { documentIndex: null };

    const documentIndex = findDocumentIndex(entity.documents, docId);
    if (documentIndex === -1) return { documentIndex: null };

    entity.documents.splice(documentIndex, 1);
    await entity.save();

    return { documentIndex };
  }

  /**
   * Format entity details with processed documents
   */
  protected formatEntityDetails(entity: any, fieldsMap: Record<string, any>) {
    const modifiedDocuments = formatDocuments(entity.documents);

    return {
      id: entity._id,
      ...fieldsMap,
      documents: modifiedDocuments,
    };
  }
}
