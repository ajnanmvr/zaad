import Company from "@/models/companies";
import Employee from "@/models/employees";
import Individual from "@/models/individuals";
import { PAGINATION } from "@/config/pagination";

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
  return Company.create(entityData);
}

export async function createEmployeeOrIndividualEntity(entityData: any, entityType?: string) {
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

export async function listCompanyEntities(page: number, limit: number) {
  const { normalizedPage, normalizedLimit, skip } = normalizePagination(page, limit);
  const query = { published: true, entityType: "company" };

  const [companies, total] = await Promise.all([
    Company.find(query)
      .select("name createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(normalizedLimit),
    Company.countDocuments(query),
  ]);

  return {
    data: companies.map((company: any) => ({
      id: company._id,
      name: company.name,
      entityType: "company" as const,
      createdAt: company.createdAt,
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
      .select("name company createdAt")
      .populate("company", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(normalizedLimit),
    Employee.countDocuments(query),
  ]);

  return {
    data: employees.map((employee: any) => ({
      id: employee._id,
      name: employee.name,
      entityType: "employee" as const,
      company: employee.company,
      createdAt: employee.createdAt,
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
      .select("name createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(normalizedLimit),
    Individual.countDocuments(query),
  ]);

  return {
    data: individuals.map((individual: any) => ({
      id: individual._id,
      name: individual.name,
      entityType: "individual" as const,
      createdAt: individual.createdAt,
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
      .select("name company createdAt")
      .populate("company", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(normalizedLimit),
    Employee.countDocuments(query),
  ]);

  return {
    data: employees.map((employee: any) => ({
      id: employee._id,
      name: employee.name,
      entityType: "employee" as const,
      company: employee.company,
      createdAt: employee.createdAt,
    })),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: Math.ceil(total / normalizedLimit),
    },
  };
}
