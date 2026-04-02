import Company from "@/models/companies";
import Employee from "@/models/employees";
import Individual from "@/models/individuals";
import EntityDocument from "@/models/entityDocuments";
import { PAGINATION } from "@/config/pagination";
import generateEntityColor from "@/utils/generateEntityColor";
import calculateStatus from "@/utils/calculateStatus";

type EntityPayload = {
  documents?: any[];
  credentials?: any[];
  password?: any[];
  [key: string]: any;
};

function normalizePagination(page: number, limit: number) {
  const normalizedPage = Math.max(Number(page) || PAGINATION.DEFAULT_PAGE, 1);
  const normalizedLimit = Math.max(
    Number(limit) || PAGINATION.LIMITS.ENTITY_LIST,
    1
  );
  const skip = (normalizedPage - 1) * normalizedLimit;
  return { normalizedPage, normalizedLimit, skip };
}

async function getDocumentStatusCountsByEntityIds(entityIds: string[]) {
  if (!entityIds.length) {
    return new Map<string, { expired: number; renewal: number; valid: number }>();
  }

  const rows = await EntityDocument.find({ entity: { $in: entityIds } }).select(
    "entity expiryDate"
  );

  const countsMap = new Map<string, { expired: number; renewal: number; valid: number }>();

  for (const row of rows as any[]) {
    const entityId = row.entity?.toString();
    if (!entityId || !row.expiryDate) {
      continue;
    }

    const status = calculateStatus(row.expiryDate);
    if (status !== "expired" && status !== "renewal" && status !== "valid") {
      continue;
    }

    const current = countsMap.get(entityId) || { expired: 0, renewal: 0, valid: 0 };
    current[status] += 1;
    countsMap.set(entityId, current);
  }

  return countsMap;
}

export function splitEntityPayload(payload: EntityPayload) {
  const { documents, credentials, password, ...entityData } = payload;
  return {
    entityData,
    documents: Array.isArray(documents) ? documents : undefined,
    credentials: Array.isArray(credentials)
      ? credentials
      : Array.isArray(password)
        ? password
        : undefined,
  };
}

export async function createCompanyEntity(entityData: any) {
  if (!entityData.color) {
    // Fetch all existing company colors to avoid duplicates
    const existingColors = await Company.find({ published: true })
      .select("color")
      .lean()
      .then((docs) => docs.map((doc: any) => doc.color).filter(Boolean));
    
    entityData.color = generateEntityColor(existingColors);
  }
  return Company.create(entityData);
}

export async function createEmployeeOrIndividualEntity(entityData: any, entityType?: string) {
  if (!entityData.color) {
    // Fetch all existing colors from both employees and individuals to avoid duplicates
    const [employeeColors, individualColors] = await Promise.all([
      Employee.find({ published: true }).select("color").lean(),
      Individual.find({ published: true }).select("color").lean(),
    ]).then(([employees, individuals]) => [
      employees.map((doc: any) => doc.color).filter(Boolean),
      individuals.map((doc: any) => doc.color).filter(Boolean),
    ]);
    
    const allExistingColors = [...employeeColors, ...individualColors];
    entityData.color = generateEntityColor(allExistingColors);
  }
  if (entityType === "individual") {
    return Individual.create(entityData);
  }
  return Employee.create(entityData);
}

export async function updateCompanyEntity(entityId: string, entityData: any) {
  return Company.findByIdAndUpdate(entityId, entityData);
}

export async function updateEmployeeEntity(entityId: string, entityData: any) {
  return Employee.findByIdAndUpdate(entityId, entityData);
}

export async function softDeleteCompanyEntity(entityId: string) {
  return Company.findByIdAndUpdate(entityId, { published: false });
}

export async function softDeleteEmployeeEntity(entityId: string) {
  return Employee.findByIdAndUpdate(entityId, { published: false });
}

export async function getCompanyEntityById(entityId: string) {
  return Company.findById(entityId);
}

export async function getEmployeeEntityById(entityId: string, populateCompany = false) {
  const query = Employee.findById(entityId);
  if (populateCompany) {
    query.populate("company");
  }
  return query;
}

type TCompanySort = "newest" | "oldest" | "name-asc" | "name-desc";

type TListCompanyEntitiesOptions = {
  search?: string;
  sortBy?: TCompanySort;
  createdWithinDays?: number;
};

export async function listCompanyEntities(
  page: number,
  limit: number,
  options?: TListCompanyEntitiesOptions
) {
  const { normalizedPage, normalizedLimit, skip } = normalizePagination(page, limit);
  const query: any = { published: true, entityType: "company" };

  if (options?.search) {
    query.name = { $regex: options.search, $options: "i" };
  }

  if (options?.createdWithinDays && options.createdWithinDays > 0) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - options.createdWithinDays);
    query.createdAt = { $gte: sinceDate };
  }

  const sortConfigByOption: Record<TCompanySort, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "name-asc": { name: 1 },
    "name-desc": { name: -1 },
  };

  const sortBy = options?.sortBy && sortConfigByOption[options.sortBy]
    ? options.sortBy
    : "newest";
  const sortConfig = sortConfigByOption[sortBy];

  const [companies, total] = await Promise.all([
    Company.find(query)
      .select("name createdAt color")
      .sort(sortConfig)
      .skip(skip)
      .limit(normalizedLimit),
    Company.countDocuments(query),
  ]);

  const companyIds = companies.map((company: any) => company._id.toString());
  const documentStatusCountsMap = await getDocumentStatusCountsByEntityIds(companyIds);

  return {
    data: companies.map((company: any) => ({
      id: company._id,
      name: company.name,
      entityType: "company" as const,
      createdAt: company.createdAt,
      color: company.color,
      documentStatusCounts:
        documentStatusCountsMap.get(company._id.toString()) || {
          expired: 0,
          renewal: 0,
          valid: 0,
        },
    })),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: Math.ceil(total / normalizedLimit),
    },
  };
}

export async function listEmployeeEntities(page: number, limit: number) {
  const { normalizedPage, normalizedLimit, skip } = normalizePagination(page, limit);
  const query = { published: true, entityType: "employee" };

  const [employees, total] = await Promise.all([
    Employee.find(query)
      .select("name company createdAt color")
      .populate("company", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(normalizedLimit),
    Employee.countDocuments(query),
  ]);

  const employeeIds = employees.map((employee: any) => employee._id.toString());
  const documentStatusCountsMap = await getDocumentStatusCountsByEntityIds(employeeIds);

  return {
    data: employees.map((employee: any) => ({
      id: employee._id,
      name: employee.name,
      entityType: "employee" as const,
      company: employee.company,
      createdAt: employee.createdAt,
      color: employee.color,
      documentStatusCounts:
        documentStatusCountsMap.get(employee._id.toString()) || {
          expired: 0,
          renewal: 0,
          valid: 0,
        },
    })),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: Math.ceil(total / normalizedLimit),
    },
  };
}

export async function listIndividualEntities(page: number, limit: number) {
  const { normalizedPage, normalizedLimit, skip } = normalizePagination(page, limit);
  const query = { published: true, entityType: "individual" };

  const [individuals, total] = await Promise.all([
    Individual.find(query)
      .select("name createdAt color")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(normalizedLimit),
    Individual.countDocuments(query),
  ]);

  const individualIds = individuals.map((individual: any) => individual._id.toString());
  const documentStatusCountsMap = await getDocumentStatusCountsByEntityIds(individualIds);

  return {
    data: individuals.map((individual: any) => ({
      id: individual._id,
      name: individual.name,
      entityType: "individual" as const,
      createdAt: individual.createdAt,
      color: individual.color,
      documentStatusCounts:
        documentStatusCountsMap.get(individual._id.toString()) || {
          expired: 0,
          renewal: 0,
          valid: 0,
        },
    })),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: Math.ceil(total / normalizedLimit),
    },
  };
}

export async function listEmployeesByCompanyEntity(
  companyId: string,
  page: number,
  limit: number
) {
  const { normalizedPage, normalizedLimit, skip } = normalizePagination(page, limit);
  const query = {
    published: true,
    company: companyId,
    entityType: "employee",
  };

  const [employees, total] = await Promise.all([
    Employee.find(query)
      .select("name company createdAt color")
      .populate("company", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(normalizedLimit),
    Employee.countDocuments(query),
  ]);

  const employeeIds = employees.map((employee: any) => employee._id.toString());
  const documentStatusCountsMap = await getDocumentStatusCountsByEntityIds(employeeIds);

  return {
    data: employees.map((employee: any) => ({
      id: employee._id,
      name: employee.name,
      entityType: "employee" as const,
      company: employee.company,
      createdAt: employee.createdAt,
      color: employee.color,
      documentStatusCounts:
        documentStatusCountsMap.get(employee._id.toString()) || {
          expired: 0,
          renewal: 0,
          valid: 0,
        },
    })),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: Math.ceil(total / normalizedLimit),
    },
  };
}
