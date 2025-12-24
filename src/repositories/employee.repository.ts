import Employee from "@/models/employees";

export const EmployeeRepository = {
  searchByName(keyword: string | null) {
    const query: any = { published: true };
    if (keyword) {
      query.name = { $regex: keyword, $options: "i" };
    }
    return Employee.find(query).select("name");
  },
};