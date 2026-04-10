import Records from "@/models/records";

export async function findPublishedRecordsByCompany(companyId: string) {
  return Records.find({
    published: true,
    company: companyId,
  }).exec();
}
