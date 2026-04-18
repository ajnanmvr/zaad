import Records from "@/models/records";

export async function findPublishedRecordsByCompany(companyId: string) {
  return Records.find({
    deletedAt: null,
    entity: companyId,
  }).exec();
}
