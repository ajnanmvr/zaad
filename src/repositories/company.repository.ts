import Company from "@/models/companies";

export const CompanyRepository = {
  create(data: any) {
    return Company.create(data);
  },

  findPublishedWithDocs() {
    return Company.find({ published: true }).select("name documents");
  },

  findById(id: string) {
    return Company.findById(id);
  },

  updateById(id: string, data: any) {
    return Company.findByIdAndUpdate(id, data);
  },

  softDelete(id: string) {
    return Company.findByIdAndUpdate(id, { published: false });
  },

  searchByName(keyword: string | null) {
    const query: any = { published: true };
    if (keyword) {
      query.name = { $regex: keyword, $options: "i" };
    }
    return Company.find(query).select("name");
  },
};