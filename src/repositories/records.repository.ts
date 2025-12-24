import Records from "@/models/records";

export const RecordsRepository = {
  findPublishedByCompany(companyId: string) {
    return Records.find({ published: true, company: companyId }).lean().exec();
  },

  create(data: any) {
    return Records.create(data);
  },

  findWithFiltersPaginated(filters: any, skip: number, limit: number) {
    return Records.find(filters)
      .populate(["createdBy", "company", "employee"])
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
  },

  findById(id: string) {
    return Records.findById(id).lean();
  },

  updateById(id: string, data: any) {
    return Records.findByIdAndUpdate(id, data);
  },

  softDelete(id: string) {
    return Records.findByIdAndUpdate(id, { published: false });
  },

  findLastSuffixAndNumber() {
    return Records.findOne({ published: true })
      .sort({ createdAt: -1 })
      .select("suffix number")
      .lean();
  },
};