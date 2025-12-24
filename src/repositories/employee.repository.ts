import Employee from "@/models/employees";

export const EmployeeRepository = {
  create(data: any) {
    return Employee.create(data);
  },

  findPublishedWithCompany() {
    return Employee.find({ published: true })
      .select("name company documents")
      .populate("company");
  },

  findByIdWithCompany(id: string) {
    return Employee.findById(id).populate("company");
  },

  updateById(id: string, data: any) {
    return Employee.findByIdAndUpdate(id, data);
  },

  softDelete(id: string) {
    return Employee.findByIdAndUpdate(id, { published: false });
  },

  findPublishedByCompany(companyId: string) {
    return Employee.find({ published: true, company: companyId })
      .select("name company documents")
      .populate("company");
  },

  searchByName(keyword: string | null) {
    const query: any = { published: true };
    if (keyword) {
      query.name = { $regex: keyword, $options: "i" };
    }
    return Employee.find(query).select("name");
  },
};