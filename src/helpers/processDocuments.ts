import { TDocuments } from "@/types/types";
import formatDate from "../utils/formatDate";

export default function processDocuments(documents: TDocuments[]): {
  expiryDate: string;
  docsCount: number;
} {
  let expiryDate: string | null = null;
  documents.forEach((doc) => {
    if (
      !expiryDate ||
      new Date(doc.expiryDate).getTime() < new Date(expiryDate).getTime()
    ) {
      expiryDate = doc.expiryDate;
    }
  });
  return { expiryDate: formatDate(expiryDate), docsCount: documents.length };
}
