import calculateStatus from "@/utils/calculateStatus";
import { TDocuments } from "@/types/types";
import { serializeObjectIds } from "@/utils/serialization";

export interface ProcessedDocument extends TDocuments {
  status: string;
}

/**
 * Format documents with status
 */
export const formatDocuments = (documents: TDocuments[]): ProcessedDocument[] => {
  return documents
    .map((doc: any) => {
      // Serialize the entire document to handle ObjectIds
      const serialized = serializeObjectIds(doc);
      return {
        _id: serialized._id,
        name: serialized.name,
        issueDate: serialized.issueDate,
        expiryDate: serialized.expiryDate,
        attachment: serialized.attachment,
        status: calculateStatus(serialized.expiryDate),
      };
    })
    .sort(
      (a, b) =>
        new Date((a.expiryDate as string) || "").getTime() -
        new Date((b.expiryDate as string) || "").getTime()
    );
};

/**
 * Find document by ID in array
 */
export const findDocumentIndex = (documents: any[], docId: string): number => {
  return documents.findIndex((d) => d._id.toString() === docId);
};

/**
 * Update document fields
 */
export const updateDocumentFields = (document: any, fields: { name?: string; issueDate?: string; expiryDate?: string; attachment?: string }): void => {
  if (fields.name !== undefined) document.name = fields.name;
  if (fields.issueDate !== undefined) document.issueDate = fields.issueDate;
  if (fields.expiryDate !== undefined) document.expiryDate = fields.expiryDate;
  if (fields.attachment !== undefined) document.attachment = fields.attachment;
};

/**
 * Document operation response type
 */
export interface DocumentOperationResult<T> {
  [key: string]: any;
  documentIndex: number | null;
}

/**
 * Validate document exists
 */
export const validateDocumentExists = (documentIndex: number, entity: any): void => {
  if (documentIndex === -1) {
    throw new Error("Document not found");
  }
};
