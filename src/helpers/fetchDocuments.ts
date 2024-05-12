import Company from "@/models/companies";
import { TDocuments } from "@/types/types";

export async function fetchDocuments(id: string, doc: string,data:any): Promise<{ data: any, documentIndex: number | null }> {
  try {
    if (!data) {
      return { data: null, documentIndex: null };
    }

    // Find the index of the document in the documents array
    const documentIndex = data.documents.findIndex(
      (document: TDocuments) => document._id.toString() === doc
    );

    return { data, documentIndex };
  } catch (err) {
    console.error(err);
    throw new Error("Error fetching documents");
  }
}
