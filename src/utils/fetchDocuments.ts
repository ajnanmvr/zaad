import Company from "@/models/companies";
import { TDocuments } from "@/libs/types";

export async function fetchDocuments(id: string, doc: string): Promise<{ company: any, documentIndex: number | null }> {
  try {
    const company = await Company.findById(id);
    if (!company) {
      return { company: null, documentIndex: null };
    }

    // Find the index of the document in the documents array
    const documentIndex = company.documents.findIndex(
      (document: TDocuments) => document._id.toString() === doc
    );

    return { company, documentIndex };
  } catch (err) {
    console.error(err);
    throw new Error("Error fetching documents");
  }
}
