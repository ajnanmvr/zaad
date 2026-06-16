import Company from "@/models/companies";

type TCompanySort = "newest" | "oldest" | "name-asc" | "name-desc";

const SORT_CONFIG_BY_OPTION: Record<TCompanySort, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  "name-asc": { name: 1 },
  "name-desc": { name: -1 },
};

export function buildCompanyListQuery(input?: {
  search?: string;
  createdWithinDays?: number;
  deleted?: boolean;
}) {
  const query: any = input?.deleted
    ? { published: false, entityType: "company" }
    : { published: true, entityType: "company" };

  if (input?.search) {
    query.name = { $regex: input.search, $options: "i" };
  }

  if (input?.createdWithinDays && input.createdWithinDays > 0) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - input.createdWithinDays);
    query.createdAt = { $gte: sinceDate };
  }

  return query;
}

export function getCompanySort(sortBy: TCompanySort | undefined) {
  if (!sortBy) {
    return SORT_CONFIG_BY_OPTION.newest;
  }
  return SORT_CONFIG_BY_OPTION[sortBy] || SORT_CONFIG_BY_OPTION.newest;
}

export async function findPublishedCompanyColors() {
  const rows = await Company.find({ published: true }).select("color").lean();
  return rows.map((row: any) => row.color).filter(Boolean);
}

export async function createCompany(entityData: any) {
  return Company.create(entityData);
}

export async function updateCompanyById(entityId: string, entityData: any) {
  return Company.findByIdAndUpdate(entityId, entityData);
}

export async function softDeleteCompanyById(entityId: string) {
  return Company.findByIdAndUpdate(entityId, { published: false });
}

export async function restoreCompanyById(entityId: string) {
  return Company.findByIdAndUpdate(entityId, { published: true });
}

export async function findCompanyById(entityId: string) {
  return Company.findById(entityId);
}

export async function findCompanies(query: any, sort: Record<string, 1 | -1>, skip: number, limit: number) {
  return Company.find(query)
    .select("name createdAt color published")
    .sort(sort)
    .skip(skip)
    .limit(limit);
}

export async function countCompanies(query: any) {
  return Company.countDocuments(query);
}

export async function searchPublishedCompaniesByName(search: string) {
  return Company.find({
    name: { $regex: search, $options: "i" },
    published: true,
  }).select("name color entityType");
}
