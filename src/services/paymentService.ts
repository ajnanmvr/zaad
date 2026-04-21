import { getRecordClient, mapRecordListItem, PAYMENT_POPULATE_FIELDS } from "@/app/api/payment/utils";
import {
  aggregateEntityRecordStatsByEntityIds,
  aggregateLiabilityEntityStatsByKeys,
  aggregateOfficeRecordCategoryStatsByKeys,
  aggregateRecords,
  bulkUpsertEntityRecordStats,
  bulkUpsertLiabilityEntityStats,
  bulkUpsertOfficeRecordCategoryStats,
  countRecordsByQuery,
  createPaymentEditNotification,
  createRecord,
  distinctEmployeeIdsByCompany,
  findEntitiesByIds,
  findEntityRecordStatsByEntityIds,
  findLiabilityEntityStatsByKeys,
  findMonthlyFinanceStatsByYearMonth,
  findOfficeRecordCategoryStatsByKeys,
  findOneRecord,
  findPaymentStatusTemplateByStatusName,
  findPaymentTemplateByMethodName,
  findPaymentTemplateMethods,
  findRecordById,
  findRecordByIdAndPopulate,
  findRecordByIdLean,
  findRecords,
  updateManyRecords,
  updateRecordById,
  upsertMonthlyFinanceStats
} from "@/repositories/paymentRepository";
import { filterData } from "@/utils/filterData";
import { randomUUID } from "crypto";

const CONTENT_PER_SECTION = 25;

type TPrincipal = {
  userId: string;
  username?: string;
  fullname?: string;
  role?: string;
};

function isObjectIdLike(value: any) {
  return (
    value &&
    typeof value === "object" &&
    (value._bsontype === "ObjectID" ||
      value._bsontype === "ObjectId" ||
      value.constructor?.name === "ObjectId")
  );
}

function normalizeForCompare(value: any): any {
  if (value === null || value === undefined) return null;
  if (isObjectIdLike(value)) return value.toString();
  if (value instanceof Date) return value.getTime();

  if (typeof value === "string") {
    const trimmed = value.trim();
    const numeric = Number(trimmed);
    if (trimmed !== "" && Number.isFinite(numeric)) {
      return numeric;
    }
    const parsedDate = Date.parse(trimmed);
    if (!Number.isNaN(parsedDate) && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return parsedDate;
    }
    return trimmed;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeForCompare(item));
  }

  if (typeof value === "object") {
    const normalizedEntries = Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entryValue]) => [key, normalizeForCompare(entryValue)]);

    return Object.fromEntries(normalizedEntries);
  }

  return value;
}

function areValuesEqual(a: any, b: any) {
  return JSON.stringify(normalizeForCompare(a)) === JSON.stringify(normalizeForCompare(b));
}

const ACTIVE_RECORD_FILTER = { deletedAt: null };

function normalizeEntityFields(payload: any) {
  const next = { ...(payload || {}) };

  const entityId = String(next.entity || "").trim();
  if (entityId) {
    next.entity = entityId;
  }

  const methodId = String(next.method || next.paymentMethodTemplate || "").trim();
  if (methodId) {
    next.method = methodId;
  }

  const statusId = String(next.status || next.paymentStatusTemplate || "").trim();
  if (statusId) {
    next.status = statusId;
  }

  delete next.entityType;
  delete next.company;
  delete next.employee;
  delete next.self;
  delete next.paymentMethodTemplate;
  delete next.paymentStatusTemplate;

  return next;
}

async function resolveMethodFilter(method?: string | null) {
  const value = String(method || "").trim();
  if (!value) {
    return null;
  }

  if (/^[a-fA-F0-9]{24}$/.test(value)) {
    return value;
  }

  const template = await findPaymentTemplateByMethodName(value);
  return template?._id?.toString?.() || value;
}

type PaymentRecordFilters = {
  pageNumber?: number;
  limit?: number;
  sort?: string | null;
  query?: string | null;
  method?: string | null;
  type?: string | null;
  status?: string | null;
  recordKind?: string | null;
  entityIds?: string | null;
  officeCategory?: string | null;
  employeeCompanyId?: string | null;
  category?: string | null;
};

async function applyPaymentRecordFilters(query: Record<string, any>, input: PaymentRecordFilters) {
  if (input.method) {
    query.method = await resolveMethodFilter(input.method);
  }

  if (input.type) {
    query.type = input.type;
  }

  if (input.status) {
    query.status = input.status;
  }

  if (input.recordKind) {
    query.recordKind = input.recordKind;
  }

  if (input.entityIds) {
    const ids = input.entityIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length > 0) {
      query.entity = { $in: ids };
    }
  }

  if (input.employeeCompanyId) {
    const employeeIds = await distinctEmployeeIdsByCompany(input.employeeCompanyId);
    const employeeIdStrings = employeeIds.map((id: any) => String(id));

    if (query.entity?.$in) {
      const intersection = query.entity.$in.filter((id: string) =>
        employeeIdStrings.includes(String(id)),
      );
      query.entity = { $in: intersection };
    } else {
      query.entity = { $in: employeeIdStrings };
    }
  }

  if (input.officeCategory) {
    query.category = input.officeCategory;
  }

  if (input.query) {
    const escapedQuery = String(input.query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedQuery, "i");
    query.$or = [{ particular: regex }, { status: regex }, { method: regex }];
  }

  if (input.category) {
    if (input.category === "office_records") {
      query.recordKind = "office_records";
    } else if (input.category === "liability") {
      query.recordKind = "liability";
    } else {
      query.category = input.category;
    }
  }

  return query;
}

function generateGroupId() {
  return randomUUID();
}

function getPaymentSortMap(sort?: string | null) {
  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    amount_asc: { amount: 1, createdAt: -1 },
    amount_desc: { amount: -1, createdAt: -1 },
  };

  return sortMap[String(sort || "newest")] || sortMap.newest;
}

type EntityLedgerTotals = {
  totalIncome: number;
  totalExpense: number;
  totalTransactions: number;
  balance: number;
  lastRecomputedAt?: string;
};

type OfficeCategorySummaryRow = {
  categoryKey: string;
  categoryId?: string;
  category: string;
  totalIncome: number;
  totalExpense: number;
  incomeCount: number;
  expenseCount: number;
  totalCount: number;
  lastRecomputedAt?: string;
};

type LiabilityEntitySummaryRow = {
  entityKey: string;
  entityId?: string;
  entity: string;
  income: number;
  expense: number;
  net: number;
  totalTransactions: number;
  lastRecomputedAt?: string;
};

const ZERO_ENTITY_TOTALS: EntityLedgerTotals = {
  totalIncome: 0,
  totalExpense: 0,
  totalTransactions: 0,
  balance: 0,
};

function normalizeEntityIds(entityIds: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      entityIds
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
}

function normalizeOfficeCategoryKeys(categoryKeys: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      categoryKeys
        .map((value) => String(value || "").trim())
        .map((value) => (value ? value : "__uncategorized__"))
        .filter(Boolean),
    ),
  );
}

function normalizeLiabilityEntityKeys(entityKeys: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      entityKeys
        .map((value) => String(value || "").trim())
        .map((value) => (value ? value : "__unknown__"))
        .filter(Boolean),
    ),
  );
}

function mapStatsRowsToTotalsByEntity(statsRows: any[]) {
  const totalsByEntity = new Map<string, EntityLedgerTotals>();

  for (const row of statsRows || []) {
    const entityId = String(row?.entity || row?._id || "").trim();
    if (!entityId) continue;

    const totalIncome = Number(row?.totalIncome || 0);
    const totalExpense = Number(row?.totalExpense || 0);
    const totalTransactions = Number(row?.totalTransactions || 0);
    const balance = Number(row?.balance ?? totalIncome - totalExpense);
    const lastRecomputedAt = row?.lastRecomputedAt
      ? new Date(row.lastRecomputedAt).toISOString()
      : undefined;

    totalsByEntity.set(entityId, {
      totalIncome,
      totalExpense,
      totalTransactions,
      balance,
      lastRecomputedAt,
    });
  }

  return totalsByEntity;
}

function sumEntityTotals(rows: EntityLedgerTotals[]) {
  return rows.reduce<EntityLedgerTotals>(
    (acc, row) => {
      acc.totalIncome += Number(row.totalIncome || 0);
      acc.totalExpense += Number(row.totalExpense || 0);
      acc.totalTransactions += Number(row.totalTransactions || 0);
      acc.balance += Number(row.balance || 0);
      return acc;
    },
    { ...ZERO_ENTITY_TOTALS },
  );
}

function mapOfficeStatsRows(statsRows: any[]) {
  const rows: OfficeCategorySummaryRow[] = [];

  for (const row of statsRows || []) {
    const categoryKey = String(row?.categoryKey || row?._id || "").trim();
    if (!categoryKey) continue;

    rows.push({
      categoryKey,
      categoryId: row?.category ? String(row.category) : undefined,
      category: String(row?.categoryLabel || "Office"),
      totalIncome: Number(row?.incomeTotal || 0),
      totalExpense: Number(row?.expenseTotal || 0),
      incomeCount: Number(row?.incomeCount || 0),
      expenseCount: Number(row?.expenseCount || 0),
      totalCount: Number(row?.totalCount || 0),
      lastRecomputedAt: row?.lastRecomputedAt
        ? new Date(row.lastRecomputedAt).toISOString()
        : undefined,
    });
  }

  return rows;
}

function mapLiabilityStatsRows(statsRows: any[]) {
  const rows: LiabilityEntitySummaryRow[] = [];

  for (const row of statsRows || []) {
    const entityKey = String(row?.entityKey || row?._id || "").trim();
    if (!entityKey) continue;

    const income = Number(row?.income || 0);
    const expense = Number(row?.expense || 0);
    rows.push({
      entityKey,
      entityId: row?.entity ? String(row.entity) : undefined,
      entity: String(row?.entityName || "Unknown Entity"),
      income,
      expense,
      net: Number(row?.net ?? income - expense),
      totalTransactions: Number(row?.totalTransactions || 0),
      lastRecomputedAt: row?.lastRecomputedAt
        ? new Date(row.lastRecomputedAt).toISOString()
        : undefined,
    });
  }

  return rows;
}

async function recomputeEntityRecordStats(entityIds?: string[]) {
  const normalizedEntityIds = normalizeEntityIds(entityIds || []);
  const recomputeAll = normalizedEntityIds.length === 0;

  // When recomputing all, get aggregates first to determine which entities have records
  if (recomputeAll) {
    const aggregateRows = await aggregateEntityRecordStatsByEntityIds();
    const aggregateByEntity = new Map<string, any>();
    for (const row of aggregateRows || []) {
      const key = String(row?._id || "").trim();
      if (key) {
        aggregateByEntity.set(key, row);
      }
    }

    if (aggregateByEntity.size === 0) {
      return {
        updatedEntities: 0,
        lastRecomputedAt: new Date().toISOString(),
      };
    }

    const now = new Date();
    const upsertRows = Array.from(aggregateByEntity.values()).map((aggregated) => {
      const entityId = String(aggregated?._id || "");
      const totalIncome = Number(aggregated?.totalIncome || 0);
      const totalExpense = Number(aggregated?.totalExpense || 0);
      const totalServiceFee = Number(aggregated?.totalServiceFee || 0);
      const totalTransactions = Number(aggregated?.totalTransactions || 0);
      return {
        entity: entityId,
        entityType: String(aggregated?.entityType || "company"),
        totalIncome,
        totalExpense,
        totalServiceFee,
        totalTransactions,
        balance: Number((totalIncome - (totalExpense + totalServiceFee)).toFixed(2)),
        lastRecomputedAt: now,
      };
    });

    await bulkUpsertEntityRecordStats(upsertRows);

    return {
      updatedEntities: upsertRows.length,
      lastRecomputedAt: now.toISOString(),
    };
  }

  // For specific entities, compute and upsert only those with records
  const aggregateRows = await aggregateEntityRecordStatsByEntityIds(normalizedEntityIds);
  const aggregateByEntity = new Map<string, any>();
  for (const row of aggregateRows || []) {
    const key = String(row?._id || "").trim();
    if (key) {
      aggregateByEntity.set(key, row);
    }
  }

  if (aggregateByEntity.size === 0) {
    return {
      updatedEntities: 0,
      lastRecomputedAt: new Date().toISOString(),
    };
  }

  const now = new Date();
  const upsertRows = Array.from(aggregateByEntity.values()).map((aggregated) => {
    const entityId = String(aggregated?._id || "");
    const totalIncome = Number(aggregated?.totalIncome || 0);
    const totalExpense = Number(aggregated?.totalExpense || 0);
    const totalServiceFee = Number(aggregated?.totalServiceFee || 0);
    const totalTransactions = Number(aggregated?.totalTransactions || 0);
    return {
      entity: entityId,
      entityType: String(aggregated?.entityType || "company"),
      totalIncome,
      totalExpense,
      totalServiceFee,
      totalTransactions,
      balance: Number((totalIncome - (totalExpense + totalServiceFee)).toFixed(2)),
      lastRecomputedAt: now,
    };
  });

  await bulkUpsertEntityRecordStats(upsertRows);

  return {
    updatedEntities: upsertRows.length,
    lastRecomputedAt: now.toISOString(),
  };
}

async function recomputeOfficeRecordCategoryStats(categoryKeys?: string[]) {
  const normalizedKeys = normalizeOfficeCategoryKeys(categoryKeys || []);
  const recomputeAll = normalizedKeys.length === 0;

  const aggregateRows = await aggregateOfficeRecordCategoryStatsByKeys(
    recomputeAll ? undefined : normalizedKeys,
  );

  const now = new Date();

  if (recomputeAll) {
    const upsertRows = (aggregateRows || []).map((row: any) => ({
      categoryKey: String(row?._id || ""),
      category: row?.category || null,
      categoryLabel: String(row?.categoryLabel || "Office"),
      incomeTotal: Number(row?.incomeTotal || 0),
      incomeCount: Number(row?.incomeCount || 0),
      expenseTotal: Number(row?.expenseTotal || 0),
      expenseCount: Number(row?.expenseCount || 0),
      totalCount: Number(row?.totalCount || 0),
      lastRecomputedAt: now,
    }));

    await bulkUpsertOfficeRecordCategoryStats(upsertRows);

    return {
      updatedOfficeCategories: upsertRows.length,
      lastRecomputedAt: now.toISOString(),
    };
  }

  const aggregateByKey = new Map<string, any>();
  for (const row of aggregateRows || []) {
    const key = String(row?._id || "").trim();
    if (key) {
      aggregateByKey.set(key, row);
    }
  }

  const upsertRows = normalizedKeys.map((key) => {
    const aggregated = aggregateByKey.get(key);
    return {
      categoryKey: key,
      category: aggregated?.category || (key === "__uncategorized__" ? null : key),
      categoryLabel: String(aggregated?.categoryLabel || "Office"),
      incomeTotal: Number(aggregated?.incomeTotal || 0),
      incomeCount: Number(aggregated?.incomeCount || 0),
      expenseTotal: Number(aggregated?.expenseTotal || 0),
      expenseCount: Number(aggregated?.expenseCount || 0),
      totalCount: Number(aggregated?.totalCount || 0),
      lastRecomputedAt: now,
    };
  });

  await bulkUpsertOfficeRecordCategoryStats(upsertRows);

  return {
    updatedOfficeCategories: upsertRows.length,
    lastRecomputedAt: now.toISOString(),
  };
}

async function recomputeLiabilityEntityStats(entityKeys?: string[]) {
  const normalizedKeys = normalizeLiabilityEntityKeys(entityKeys || []);
  const recomputeAll = normalizedKeys.length === 0;

  const aggregateRows = await aggregateLiabilityEntityStatsByKeys(
    recomputeAll ? undefined : normalizedKeys,
  );

  const now = new Date();

  if (recomputeAll) {
    const upsertRows = (aggregateRows || []).map((row: any) => {
      const income = Number(row?.income || 0);
      const expense = Number(row?.expense || 0);
      return {
        entityKey: String(row?._id || ""),
        entity: row?.entity || null,
        entityName: String(row?.entityName || "Unknown Entity"),
        income,
        expense,
        net: Number(row?.net ?? income - expense),
        totalTransactions: Number(row?.totalTransactions || 0),
        lastRecomputedAt: now,
      };
    });

    await bulkUpsertLiabilityEntityStats(upsertRows);

    return {
      updatedLiabilityEntities: upsertRows.length,
      lastRecomputedAt: now.toISOString(),
    };
  }

  const aggregateByKey = new Map<string, any>();
  for (const row of aggregateRows || []) {
    const key = String(row?._id || "").trim();
    if (key) {
      aggregateByKey.set(key, row);
    }
  }

  const upsertRows = normalizedKeys.map((key) => {
    const aggregated = aggregateByKey.get(key);
    const income = Number(aggregated?.income || 0);
    const expense = Number(aggregated?.expense || 0);

    return {
      entityKey: key,
      entity: aggregated?.entity || (key === "__unknown__" ? null : key),
      entityName: String(aggregated?.entityName || "Unknown Entity"),
      income,
      expense,
      net: Number(aggregated?.net ?? income - expense),
      totalTransactions: Number(aggregated?.totalTransactions || 0),
      lastRecomputedAt: now,
    };
  });

  await bulkUpsertLiabilityEntityStats(upsertRows);

  return {
    updatedLiabilityEntities: upsertRows.length,
    lastRecomputedAt: now.toISOString(),
  };
}

async function getEntityTotals(entityId: string): Promise<EntityLedgerTotals> {
  const normalizedEntityId = String(entityId || "").trim();
  if (!normalizedEntityId) {
    return { ...ZERO_ENTITY_TOTALS };
  }

  let statsRows = await findEntityRecordStatsByEntityIds([normalizedEntityId]);
  let byEntity = mapStatsRowsToTotalsByEntity(statsRows);

  // Backfill on first read for existing entities that do not yet have cached stats.
  if (!byEntity.has(normalizedEntityId)) {
    await recomputeEntityRecordStats([normalizedEntityId]);
    statsRows = await findEntityRecordStatsByEntityIds([normalizedEntityId]);
    byEntity = mapStatsRowsToTotalsByEntity(statsRows);
  }

  return byEntity.get(normalizedEntityId) || { ...ZERO_ENTITY_TOTALS };
}

async function getCompanyScopedEntityTotals(
  companyId: string,
  recordScope: "company" | "employees" | "mixed",
) {
  const employeeIds = await distinctEmployeeIdsByCompany(companyId);
  const employeeIdStrings = employeeIds.map((id: any) => String(id));

  const scopedEntityIds =
    recordScope === "employees"
      ? employeeIdStrings
      : recordScope === "mixed"
        ? [companyId, ...employeeIdStrings]
        : [companyId];

  const normalizedIds = normalizeEntityIds(scopedEntityIds);
  if (!normalizedIds.length) {
    return { ...ZERO_ENTITY_TOTALS };
  }

  let statsRows = await findEntityRecordStatsByEntityIds(normalizedIds);
  let byEntity = mapStatsRowsToTotalsByEntity(statsRows);

  const missingEntityIds = normalizedIds.filter((entityId) => !byEntity.has(entityId));
  if (missingEntityIds.length > 0) {
    await recomputeEntityRecordStats(missingEntityIds);
    statsRows = await findEntityRecordStatsByEntityIds(normalizedIds);
    byEntity = mapStatsRowsToTotalsByEntity(statsRows);
  }

  const scopedTotals = sumEntityTotals(
    normalizedIds.map((entityId) => byEntity.get(entityId) || { ...ZERO_ENTITY_TOTALS }),
  );

  return scopedTotals;
}

export function isAdminRole(role?: string) {
  const normalized = (role || "").toLowerCase().replace(/[\s_-]+/g, "");
  return normalized === "admin" || normalized === "superadmin";
}

export async function recomputeAllEntityLedgerStats() {
  const [entityStats, officeStats, liabilityStats] = await Promise.all([
    recomputeEntityRecordStats(),
    recomputeOfficeRecordCategoryStats(),
    recomputeLiabilityEntityStats(),
  ]);

  return {
    ...entityStats,
    ...officeStats,
    ...liabilityStats,
    lastRecomputedAt: new Date().toISOString(),
  };
}

export async function getOfficeRecordCategorySummaryFromStats() {
  let statsRows = await findOfficeRecordCategoryStatsByKeys();
  let rows = mapOfficeStatsRows(statsRows).filter((row) => row.totalCount > 0);

  if (!rows.length) {
    await recomputeOfficeRecordCategoryStats();
    statsRows = await findOfficeRecordCategoryStatsByKeys();
    rows = mapOfficeStatsRows(statsRows).filter((row) => row.totalCount > 0);
  }

  const incomeByCategory = rows
    .filter((row) => row.incomeCount > 0)
    .map((row) => ({
      category: row.category,
      total: Number(row.totalIncome.toFixed(2)),
      count: row.incomeCount,
      categoryKey: row.categoryKey,
      categoryId: row.categoryId,
      lastRecomputedAt: row.lastRecomputedAt,
    }))
    .sort((a, b) => b.total - a.total);

  const expenseByCategory = rows
    .filter((row) => row.expenseCount > 0)
    .map((row) => ({
      category: row.category,
      total: Number(row.totalExpense.toFixed(2)),
      count: row.expenseCount,
      categoryKey: row.categoryKey,
      categoryId: row.categoryId,
      lastRecomputedAt: row.lastRecomputedAt,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    incomeByCategory,
    expenseByCategory,
    totalIncome: Number(rows.reduce((sum, row) => sum + row.totalIncome, 0).toFixed(2)),
    totalExpense: Number(rows.reduce((sum, row) => sum + row.totalExpense, 0).toFixed(2)),
    lastRecomputedAt: rows[0]?.lastRecomputedAt,
  };
}

export async function getLiabilityEntitySummaryFromStats() {
  let statsRows = await findLiabilityEntityStatsByKeys();
  let rows = mapLiabilityStatsRows(statsRows).filter((row) => row.totalTransactions > 0);

  if (!rows.length) {
    await recomputeLiabilityEntityStats();
    statsRows = await findLiabilityEntityStatsByKeys();
    rows = mapLiabilityStatsRows(statsRows).filter((row) => row.totalTransactions > 0);
  }

  const entities = rows
    .map((row) => ({
      entity: row.entity,
      income: Number(row.income.toFixed(2)),
      expense: Number(row.expense.toFixed(2)),
      net: Number(row.net.toFixed(2)),
      entityKey: row.entityKey,
      entityId: row.entityId,
      totalTransactions: row.totalTransactions,
      lastRecomputedAt: row.lastRecomputedAt,
    }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  const totals = entities.reduce(
    (acc, row) => {
      acc.income += row.income;
      acc.expense += row.expense;
      acc.net += row.net;
      return acc;
    },
    { income: 0, expense: 0, net: 0 },
  );

  return {
    entities,
    totals: {
      income: Number(totals.income.toFixed(2)),
      expense: Number(totals.expense.toFixed(2)),
      net: Number(totals.net.toFixed(2)),
    },
    lastRecomputedAt: rows[0]?.lastRecomputedAt,
  };
}

async function resolveLinkedRecordIds(record: any, includeArchived = false) {
  if (!record?._id) {
    return [];
  }

  const recordId = String(record._id);
  const recordKind = String(record.recordKind || "").toLowerCase();
  const linkedIds = new Set<string>([recordId]);
  const publicationFilter = includeArchived ? {} : ACTIVE_RECORD_FILTER;

  if (record.transferGroupId) {
    const partners = await findRecords(
      {
        ...publicationFilter,
        transferGroupId: record.transferGroupId,
        _id: { $ne: record._id },
      },
      { select: "_id" }
    );

    partners.forEach((partner: any) => linkedIds.add(String(partner._id)));
    if (linkedIds.size > 1) {
      return Array.from(linkedIds);
    }
  }

  if (recordKind === "self_transfer") {
    const partners = await findRecords({
      ...publicationFilter,
      recordKind: "self_transfer",
      createdBy: record.createdBy,
      suffix: record.suffix,
      amount: record.amount,
      _id: { $ne: record._id },
    }, { select: "_id" });

    partners.forEach((partner: any) => linkedIds.add(String(partner._id)));
    return Array.from(linkedIds);
  }

  return Array.from(linkedIds);
}

async function refreshEntityStatsForRecordRows(records: any[]) {
  const affectedEntityIds = normalizeEntityIds(
    (records || []).map((record) => record?.entity?.toString?.() || record?.entity),
  );

  const affectedOfficeCategoryKeys = normalizeOfficeCategoryKeys(
    (records || [])
      .filter((record) => String(record?.recordKind || "").toLowerCase() === "office_records")
      .map((record) => record?.category?.toString?.() || record?.category),
  );

  const affectedLiabilityEntityKeys = normalizeLiabilityEntityKeys(
    (records || [])
      .filter((record) => String(record?.recordKind || "").toLowerCase() === "liability")
      .map((record) => record?.entity?.toString?.() || record?.entity),
  );

  if (
    !affectedEntityIds.length &&
    !affectedOfficeCategoryKeys.length &&
    !affectedLiabilityEntityKeys.length
  ) {
    return;
  }

  await Promise.all([
    affectedEntityIds.length ? recomputeEntityRecordStats(affectedEntityIds) : Promise.resolve(),
    affectedOfficeCategoryKeys.length
      ? recomputeOfficeRecordCategoryStats(affectedOfficeCategoryKeys)
      : Promise.resolve(),
    affectedLiabilityEntityKeys.length
      ? recomputeLiabilityEntityStats(affectedLiabilityEntityKeys)
      : Promise.resolve(),
  ]);
}

function buildTotals(records: any[]) {
  const totalIncome = records.reduce<number>(
    (acc: number, record: any) =>
      acc +
      (record.type === "income" && record.recordKind !== "liability"
        ? record.amount
        : 0),
    0
  );

  const totalExpense = records.reduce<number>(
    (acc: number, record: any) => acc + (record.type === "expense" ? record.amount : 0) + (record.serviceFee || 0),
    0
  );

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    totalTransactions: records.length,
  };
}

type SelfDepositTransfer = {
  id: string;
  expense?: ReturnType<typeof mapRecordListItem>;
  income?: ReturnType<typeof mapRecordListItem>;
};

type PaymentTotalRecord = {
  type?: string;
  amount?: number;
  serviceFee?: number;
};

function canPairRecords(expense: any, income: any) {
  if (!expense || !income) return false;

  return (
    expense.recordKind === "self_transfer" &&
    income.recordKind === "self_transfer" &&
    expense.type === "expense" &&
    income.type === "income" &&
    expense.amount === income.amount &&
    String(expense.transferGroupId || "") === String(income.transferGroupId || "") &&
    String(expense.suffix || "") === String(income.suffix || "") &&
    String(expense.createdBy || "") === String(income.createdBy || "")
  );
}

function buildTransfers(records: any[]): SelfDepositTransfer[] {
  const transfers: SelfDepositTransfer[] = [];

  for (let index = 0; index < records.length; index += 1) {
    const current = records[index];
    const next = records[index + 1];

    if (current?.type === "income" && next?.type === "expense" && canPairRecords(next, current)) {
      transfers.push({
        id: `${next._id}-${current._id}`,
        expense: mapRecordListItem(next),
        income: mapRecordListItem(current),
      });
      index += 1;
      continue;
    }

    if (current?.type === "expense" && next?.type === "income" && canPairRecords(current, next)) {
      transfers.push({
        id: `${current._id}-${next._id}`,
        expense: mapRecordListItem(current),
        income: mapRecordListItem(next),
      });
      index += 1;
      continue;
    }

    transfers.push({
      id: String(current?._id || index),
      expense: current?.type === "expense" ? mapRecordListItem(current) : undefined,
      income: current?.type === "income" ? mapRecordListItem(current) : undefined,
    });
  }

  return transfers;
}

export async function createPaymentRecord(reqBody: any, principal: TPrincipal) {
  const normalizedPayload = normalizeEntityFields(reqBody);
  const recordKind = String(normalizedPayload.recordKind || "").toLowerCase();
  const requiresMethod = !["liability", "self_transfer"].includes(recordKind);

  // Validate required fields before creating
  const missingFields: string[] = [];
  
  if (!normalizedPayload.particular || String(normalizedPayload.particular).trim() === "") {
    missingFields.push("particular");
  }
  
  if (!normalizedPayload.amount && normalizedPayload.amount !== 0) {
    missingFields.push("amount");
  }
  
  if (!normalizedPayload.type) {
    missingFields.push("type");
  }
  
  if (
    requiresMethod &&
    (!normalizedPayload.method || String(normalizedPayload.method).trim() === "")
  ) {
    missingFields.push("method");
  }
  
  // status is no longer required for any record kind
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  const data = await createRecord({
    ...normalizedPayload,
    status:
      recordKind === "liability"
        ? normalizedPayload.status || undefined
        : normalizedPayload.status,
    createdBy: principal.userId,
    activityLog: [
      {
        action: "create",
        at: new Date(),
        by: principal.userId,
        byUsername: principal.username,
        byFullname: principal.fullname,
        details: "Transaction created",
      },
    ],
  });

  await refreshEntityStatsForRecordRows([data]);

  return data;
}

export async function listPaymentRecords(input: {
  pageNumber: number;
  limit?: number;
  sort?: string | null;
  query?: string | null;
  method?: string | null;
  type?: string | null;
  status?: string | null;
  recordKind?: string | null;
  entityIds?: string | null;
  officeCategory?: string | null;
  employeeCompanyId?: string | null;
  category?: string | null;
}) {
  const contentPerSection = Math.min(Math.max(Number(input.limit || 25), 1), 200);
  const query: Record<string, any> = { ...ACTIVE_RECORD_FILTER };

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    amount_asc: { amount: 1, createdAt: -1 },
    amount_desc: { amount: -1, createdAt: -1 },
  };

  await applyPaymentRecordFilters(query, input);

  const records = await findRecords(query, {
    populate: PAYMENT_POPULATE_FIELDS,
    skip: input.pageNumber * contentPerSection,
    limit: contentPerSection + 1,
    sort: sortMap[String(input.sort || "newest")] || sortMap.newest,
  });

  if (!records || records.length === 0) {
    return { message: "No records found", count: 0, hasMore: false, records: [] };
  }

  const hasMore = records.length > contentPerSection;
  const transformedData = records.slice(0, contentPerSection).map(mapRecordListItem);

  return { count: transformedData.length, hasMore, records: transformedData };
}

export async function getPaymentRecordById(id: string) {
  return findRecordById(id);
}

export async function getPaymentRecordDetails(id: string) {
  const record = await findRecordByIdAndPopulate(id, PAYMENT_POPULATE_FIELDS);
  if (!record) {
    return null;
  }

  return { record: mapRecordListItem(record) };
}

export async function getPreviousPaymentSequence() {
  const latest = await findOneRecord({ ...ACTIVE_RECORD_FILTER }, "suffix number", {
    createdAt: -1,
  });
return { 
  suffix: latest?.suffix, 
  number: (latest?.number || 0) + 1 
};}

export async function createSwapTransfer(payload: { amount: any; to: string; from: string }, principal: TPrincipal) {
  const { amount, to, from } = payload;

  if (!from || !to) {
    return { status: 400, body: { message: "Please select both payment methods" } };
  }
  if (from === to) {
    return { status: 400, body: { message: "From and to methods must be different" } };
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return { status: 400, body: { message: "The amount should be greater than 0" } };
  }

  const fromMethod = await resolveMethodFilter(from);
  const toMethod = await resolveMethodFilter(to);

  const latest = await findOneRecord({ ...ACTIVE_RECORD_FILTER }, "suffix number", { createdAt: -1 });
  const newSuffix = latest?.suffix || "";
  const newNumber = latest?.number || 0;
  const transferGroupId = generateGroupId();

  const firstRecord = await createRecord({
    createdBy: principal.userId,
    type: "expense",
    recordKind: "self_transfer",
    transferGroupId,
    method: fromMethod,
    amount: numericAmount,
    suffix: newSuffix,
    number: newNumber + 1,
    particular: `Money removed from ${from} to add in ${to}`,
    activityLog: [
      {
        action: "create",
        at: new Date(),
        by: principal.userId,
        byUsername: principal.username,
        byFullname: principal.fullname,
        details: "Self transfer out transaction created",
      },
    ],
  });

  const secondRecord = await createRecord({
    createdBy: principal.userId,
    type: "income",
    recordKind: "self_transfer",
    transferGroupId,
    method: toMethod,
    amount: numericAmount,
    suffix: newSuffix,
    number: newNumber + 2,
    particular: `Money recieved as exchange from ${from}`,
    activityLog: [
      {
        action: "create",
        at: new Date(),
        by: principal.userId,
        byUsername: principal.username,
        byFullname: principal.fullname,
        details: "Self transfer in transaction created",
      },
    ],
  });

  return { status: 201, body: { message: "Self Deposit Completed Successfully" } };
}

export async function listSelfPayments(pageNumber: number) {
  const contentPerSection = 10;
  const query = {
    ...ACTIVE_RECORD_FILTER,
    recordKind: "self_transfer",
  };

  const records = await findRecords(query, {
    populate: PAYMENT_POPULATE_FIELDS,
    skip: pageNumber * contentPerSection,
    limit: contentPerSection + 1,
    sort: { createdAt: -1 },
  });

  if (!records || records.length === 0) {
    return {
      message: "No records found",
      count: 0,
      hasMore: false,
      records: [],
      balance: 0,
      totalIncome: 0,
      totalExpense: 0,
      totalTransactions: 0,
    };
  }

  const hasMore = records.length > contentPerSection;
  const transformedData = records.slice(0, contentPerSection).map(mapRecordListItem);
  const allRecords = (await findRecords(query)) as PaymentTotalRecord[];
  const totals = buildTotals(allRecords);

  return {
    count: transformedData.length,
    hasMore,
    records: transformedData,
    ...totals,
  };
}

export async function listSelfDepositPayments(input: {
  pageNumber: number;
  type?: string | null;
  method?: string | null;
  query?: string | null;
  sort?: string | null;
  from?: string | null;
  to?: string | null;
  month?: string | null;
  year?: string | null;
}) {
  const contentPerSection = 10;
  const query: Record<string, any> = {
    ...ACTIVE_RECORD_FILTER,
    recordKind: "self_transfer",
  };

  if (input.type) {
    query.type = input.type;
  }
  if (input.method) {
    query.method = await resolveMethodFilter(input.method);
  }

  // Add date range filtering
  if (input.from || input.to) {
    const dateQuery: Record<string, any> = {};
    if (input.from) {
      dateQuery.$gte = new Date(input.from);
    }
    if (input.to) {
      const toDate = new Date(input.to);
      toDate.setHours(23, 59, 59, 999);
      dateQuery.$lte = toDate;
    }
    query.createdAt = dateQuery;
  } else if (input.month || input.year) {
    // Handle month/year filtering
    const now = new Date();
    const monthNum = input.month ? Number(input.month) : now.getMonth() + 1;
    const yearNum = input.year ? Number(input.year) : now.getFullYear();
    
    const monthStart = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(yearNum, monthNum, 1, 0, 0, 0, 0);
    
    query.createdAt = {
      $gte: monthStart,
      $lt: monthEnd,
    };
  }

  const records = await findRecords(query, {
    populate: PAYMENT_POPULATE_FIELDS,
    sort: { createdAt: -1 },
  });

  if (!records || records.length === 0) {
    return {
      message: "No self deposit records found",
      count: 0,
      hasMore: false,
      records: [],
      balance: 0,
      totalIncome: 0,
      totalExpense: 0,
      totalTransactions: 0,
    };
  }

  const groupedTransfers = buildTransfers(records);
  const normalizedQuery = String(input.query || "")
    .trim()
    .toLowerCase();

  const filteredTransfers = groupedTransfers.filter((transfer) => {
    if (!normalizedQuery) return true;

    const expense = transfer.expense;
    const income = transfer.income;
    const blob = [
      expense?.method || "",
      income?.method || "",
      expense?.particular || "",
      income?.particular || "",
      expense?.remarks || "",
      income?.remarks || "",
      expense?.suffix || "",
      expense?.number || "",
      income?.suffix || "",
      income?.number || "",
    ]
      .join(" ")
      .toLowerCase();

    return blob.includes(normalizedQuery);
  });

  const sortedTransfers = [...filteredTransfers].sort((a, b) => {
    const amountA = Number(a.expense?.amount || a.income?.amount || 0);
    const amountB = Number(b.expense?.amount || b.income?.amount || 0);
    const dateA = new Date(String(a.expense?.createdAt || a.income?.createdAt || 0)).getTime();
    const dateB = new Date(String(b.expense?.createdAt || b.income?.createdAt || 0)).getTime();

    if (input.sort === "amount-asc") return amountA - amountB;
    if (input.sort === "amount-desc") return amountB - amountA;
    if (input.sort === "oldest") return dateA - dateB;
    return dateB - dateA;
  });

  const start = input.pageNumber * contentPerSection;
  const transformedData = sortedTransfers.slice(start, start + contentPerSection);
  const hasMore = sortedTransfers.length > start + contentPerSection;
  const allRecords = (await findRecords(query)) as PaymentTotalRecord[];

  const totalIncome = allRecords.reduce<number>(
    (acc: number, record: any) => acc + (record.type === "income" ? record.amount : 0),
    0
  );

  const totalExpense = allRecords.reduce<number>(
    (acc: number, record: any) =>
      acc + (record.type === "expense" ? record.amount : 0) + (record.serviceFee || 0),
    0
  );

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const thisMonthTransfers = filteredTransfers.filter((transfer) => {
    const createdAt = transfer.expense?.createdAt || transfer.income?.createdAt;
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    if (Number.isNaN(createdDate.getTime())) return false;
    return createdDate >= thisMonthStart;
  }).length;

  return {
    count: transformedData.length,
    hasMore,
    records: transformedData,
    balance: totalIncome - totalExpense,
    totalIncome,
    totalExpense,
    totalTransactions: filteredTransfers.length,
    report: {
      thisMonthTransfers,
      allTimeTransfers: filteredTransfers.length,
    },
  };
}

export async function listLiabilitySummary() {
  const records = await findRecords(
    {
      ...ACTIVE_RECORD_FILTER,
      recordKind: "liability",
    },
    {
      populate: PAYMENT_POPULATE_FIELDS,
      sort: { createdAt: -1 },
    }
  );

  if (!records || records.length === 0) {
    return {
      message: "No records found",
      count: 0,
      records: [],
      balance: 0,
      totalIncome: 0,
    };
  }

  const groupedData = records.reduce((acc: Record<string, any>, record: any) => {
    const client = getRecordClient(record);

    if (client) {
      const clientId = String((client as any).id || client.name);
      if (!acc[clientId]) {
        acc[clientId] = {
          client,
          income: 0,
          expense: 0,
        };
      }

      if (record.type === "income") {
        acc[clientId].income += record.amount;
      } else if (record.type === "expense") {
        acc[clientId].expense += record.amount;
      }
    }

    return acc;
  }, {});

  const transformedData = Object.values(groupedData).map((data: any) => ({
    client: data.client,
    netAmount: data.income - data.expense,
  }));

  return {
    message: "Records retrieved successfully",
    count: records.length,
    records: transformedData,
    amount: transformedData.reduce<number>((acc: number, data: any) => acc + data.netAmount, 0),
  };
}

export async function createProfitPair(reqBody: any, principal: TPrincipal) {
  const toMethodId = String(reqBody?.to || "").trim();
  const serviceFeeTemplate = toMethodId
    ? null
    : await findPaymentTemplateByMethodName("service fee");

  const profitStatusTemplate = await findPaymentStatusTemplateByStatusName("Profit");

  const normalizedPayload = normalizeEntityFields({
    ...reqBody,
    // Persist instant-profit pairs as standard records in DB.
    recordKind: "standard",
  });

  if (profitStatusTemplate) {
    normalizedPayload.status = profitStatusTemplate._id;
  }

  const firstRecord = await createRecord({
    ...normalizedPayload,
    createdBy: principal.userId,
    activityLog: [
      {
        action: "create",
        at: new Date(),
        by: principal.userId,
        byUsername: principal.username,
        byFullname: principal.fullname,
        details: "Instant profit transaction created",
      },
    ],
  });

  const {
    amount: originalAmount,
    number,
    type: originalType,
    serviceFee: originalServiceFee,
    method: originalMethod,
    ...rest
  } = normalizedPayload;

  const mirrorMethod = toMethodId || serviceFeeTemplate?._id || originalMethod;
  if (!mirrorMethod) {
    throw new Error("Payment method is required for instant profit records");
  }

  const secondRecord = await createRecord({
    ...rest,
    // Mirror expense carries the income amount as service fee.
    serviceFee: Number(originalAmount || 0),
    amount: 0,
    type: "expense",
    recordKind: "standard",
    method: mirrorMethod,
    number: +number + 1,
    createdBy: principal.userId,
    activityLog: [
      {
        action: "create",
        at: new Date(),
        by: principal.userId,
        byUsername: principal.username,
        byFullname: principal.fullname,
        details: "Service-fee mirror transaction created",
      },
    ],
  });

  await refreshEntityStatsForRecordRows([firstRecord, secondRecord]);
}

export async function listPaymentAccounts(searchParams: URLSearchParams) {
  const filter = filterData(searchParams, true);
  const normalizedFilter = { ...filter, deletedAt: null };
  const [aggregate, paymentTemplates, detailedRecords] = await Promise.all([
    aggregateRecords([
      { $match: normalizedFilter },
      {
        $group: {
          _id: {
            type: "$type",
            methodTemplate: "$method",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          serviceFeeTotal: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, { $ifNull: ["$serviceFee", 0] }, 0],
            },
          },
          zaadExpenseTotal: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$type", "expense"] },
                    { $eq: ["$recordKind", "self_transfer"] },
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
        },
      },
    ]),
    findPaymentTemplateMethods(),
    findRecords(normalizedFilter, {
      select: "amount type createdAt entity method status recordKind",
      populate: [
        { path: "entity", select: "name entityType color" },
        { path: "method", select: "method color icon" },
        { path: "status", select: "status color" },
      ],
      lean: true,
    }),
  ]);

  const methodNameById = new Map(
    (paymentTemplates as any[]).map((item: any) => [String(item._id), String(item.method)])
  );

  const summary: Record<string, Record<string, number>> = { income: {}, expense: {} };
  let incomeCount = 0;
  let expenseCount = 0;
  let profit = 0;
  let zaadExpenseTotal = 0;

  for (const row of aggregate as any[]) {
    const type = row?._id?.type;
    const methodTemplateId = String(row?._id?.methodTemplate || "");
    const method = methodNameById.get(methodTemplateId) || "unknown";
    if (!type) continue;

    if (!summary[type]) {
      summary[type] = {};
    }
    summary[type][method] = row.total || 0;

    if (type === "income") {
      incomeCount += row.count || 0;
    }
    if (type === "expense") {
      expenseCount += row.count || 0;
      profit += row.serviceFeeTotal || 0;
      zaadExpenseTotal += row.zaadExpenseTotal || 0;
    }
  }

  const methodsFromSummary = Array.from(
    new Set([...Object.keys(summary.income || {}), ...Object.keys(summary.expense || {})])
  );
  const methodsFromTemplates = (paymentTemplates as any[]).map((item: any) => item.method).filter(Boolean);
  const extraMethods = methodsFromSummary
    .filter((method) => !methodsFromTemplates.includes(method))
    .sort((a, b) => a.localeCompare(b));
  const allMethods = methodsFromTemplates.concat(extraMethods);

  const methodBreakdown = allMethods.map((method) => {
    const income = summary.income?.[method] || 0;
    const expense = summary.expense?.[method] || 0;
    return { method, income, expense, balance: income - expense };
  });

  const methodBalances = methodBreakdown.reduce<Record<string, number>>((acc, row) => {
    acc[row.method] = row.balance;
    return acc;
  }, {});

  const roundedZaadExpenseTotal = parseFloat((zaadExpenseTotal || 0).toFixed(2));
  const grossProfit = parseFloat(profit.toFixed(2));
  const profitAfterOfficeExpenses = parseFloat((grossProfit - roundedZaadExpenseTotal).toFixed(2));

  const totalIncomeAmount = Object.values(summary.income || {}).reduce((sum, value) => sum + (value || 0), 0);
  const totalExpenseAmount = Object.values(summary.expense || {}).reduce((sum, value) => sum + (value || 0), 0);
  const totalBalance = totalIncomeAmount - totalExpenseAmount;

  const dailyMap = new Map<string, { income: number; expense: number }>();
  const monthlyMap = new Map<string, { income: number; expense: number }>();
  const statusMap = new Map<string, { income: number; expense: number; total: number }>();
  const entityMap = new Map<string, any>();

  for (const record of detailedRecords as any[]) {
    const amount = Number(record?.amount || 0);
    const type = record?.type === "income" ? "income" : "expense";
    const createdAt = record?.createdAt ? new Date(record.createdAt) : null;

    if (createdAt && !Number.isNaN(createdAt.getTime())) {
      const dayKey = createdAt.toISOString().slice(0, 10);
      const monthKey = `${createdAt.getUTCFullYear()}-${String(createdAt.getUTCMonth() + 1).padStart(2, "0")}`;

      const dayBucket = dailyMap.get(dayKey) || { income: 0, expense: 0 };
      dayBucket[type] += amount;
      dailyMap.set(dayKey, dayBucket);

      const monthBucket = monthlyMap.get(monthKey) || { income: 0, expense: 0 };
      monthBucket[type] += amount;
      monthlyMap.set(monthKey, monthBucket);
    }

    const normalizedStatus = String(record?.status?.status || "unknown").trim().toLowerCase() || "unknown";
    const statusBucket = statusMap.get(normalizedStatus) || { income: 0, expense: 0, total: 0 };
    statusBucket[type] += amount;
    statusBucket.total += amount;
    statusMap.set(normalizedStatus, statusBucket);

    let entityKey = "unknown";
    let entityLabel = "Unknown";
    let entityType: "company" | "employee" | "individual" | "self" | "unknown" = "unknown";

    if (record?.entity?._id) {
      const resolvedType = String(record.entity.entityType || record.entityType || "").toLowerCase();
      entityType =
        resolvedType === "company"
          ? "company"
          : resolvedType === "individual"
            ? "individual"
            : "employee";
      entityKey = `${resolvedType || "entity"}:${String(record.entity._id)}`;
      entityLabel = String(record.entity.name || "Unknown Entity");
    } else if (record?.recordKind === "self_transfer") {
      entityKey = "self:zaad";
      entityLabel = "ZAAD SELF";
      entityType = "self";
    }

    const entityBucket = entityMap.get(entityKey) || {
      label: entityLabel,
      entityType,
      income: 0,
      expense: 0,
      volume: 0,
    };

    entityBucket[type] += amount;
    entityBucket.volume += amount;
    entityMap.set(entityKey, entityBucket);
  }

  const dailyTrend = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, bucket]) => ({
      date,
      income: parseFloat(bucket.income.toFixed(2)),
      expense: parseFloat(bucket.expense.toFixed(2)),
    }));

  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, bucket]) => ({
      month,
      income: parseFloat(bucket.income.toFixed(2)),
      expense: parseFloat(bucket.expense.toFixed(2)),
    }));

  const statusBreakdown = Array.from(statusMap.entries())
    .map(([status, bucket]) => ({
      status,
      income: parseFloat(bucket.income.toFixed(2)),
      expense: parseFloat(bucket.expense.toFixed(2)),
      total: parseFloat(bucket.total.toFixed(2)),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const topEntities = Array.from(entityMap.entries())
    .map(([key, bucket]) => ({
      key,
      label: bucket.label,
      entityType: bucket.entityType,
      income: parseFloat(bucket.income.toFixed(2)),
      expense: parseFloat(bucket.expense.toFixed(2)),
      balance: parseFloat((bucket.income - bucket.expense).toFixed(2)),
      volume: parseFloat(bucket.volume.toFixed(2)),
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);

  return {
    expenseCount,
    incomeCount,
    summary,
    methodBreakdown,
    methodBalances,
    totalIncomeAmount,
    totalExpenseAmount,
    totalBalance,
    profit: grossProfit,
    grossProfit,
    zaadExpenseTotal: roundedZaadExpenseTotal,
    profitAfterOfficeExpenses,
    netProfit: profitAfterOfficeExpenses,
    dailyTrend,
    monthlyTrend,
    statusBreakdown,
    topEntities,
  };
}

export async function listPaymentBin(input: {
  pageNumber: number;
  search?: string;
}) {
  const query: Record<string, any> = { deletedAt: { $ne: null } };
  if (input.search?.trim()) {
    query.$or = [
      { particular: { $regex: input.search.trim(), $options: "i" } },
      { suffix: { $regex: input.search.trim(), $options: "i" } },
    ];
  }

  const records = await findRecords(query, {
    populate: PAYMENT_POPULATE_FIELDS,
    sort: { deletedAt: -1, updatedAt: -1 },
    skip: input.pageNumber * CONTENT_PER_SECTION,
    limit: CONTENT_PER_SECTION + 1,
  });

  const hasMore = records.length > CONTENT_PER_SECTION;
  const transformedData = records.slice(0, CONTENT_PER_SECTION).map(mapRecordListItem);

  return {
    count: transformedData.length,
    hasMore,
    records: transformedData,
  };
}

export async function listCompanyPaymentRecords(
  companyId: string,
  input: PaymentRecordFilters & { recordScope?: "company" | "employees" | "mixed" } = {},
) {
  const pageSize = Math.min(Math.max(Number(input.limit || 25), 1), 200);
  const employeeIds = await distinctEmployeeIdsByCompany(companyId);
  const query: Record<string, any> = { ...ACTIVE_RECORD_FILTER };

  if (input.recordScope === "employees") {
    query.entity = { $in: employeeIds };
  } else if (input.recordScope === "mixed") {
    query.entity = { $in: [companyId, ...employeeIds] };
  } else {
    query.entity = companyId;
  }

  await applyPaymentRecordFilters(query, input);

  const records = await findRecords(query, {
    populate: PAYMENT_POPULATE_FIELDS,
    sort: getPaymentSortMap(input.sort),
    skip: Number(input.pageNumber || 0) * pageSize,
    limit: pageSize + 1,
  });

  if (!records || records.length === 0) {
    return {
      message: "No records found",
      count: 0,
      records: [],
      balance: 0,
      totalIncome: 0,
      totalExpense: 0,
      totalTransactions: 0,
      hasMore: false,
    };
  }

  const hasMore = records.length > pageSize;
  const transformedData = records.slice(0, pageSize).map(mapRecordListItem);
  const totals = await getCompanyScopedEntityTotals(
    companyId,
    input.recordScope || "company",
  );

  return {
    count: transformedData.length,
    records: transformedData,
    ...totals,
    hasMore,
  };
}

export async function listEmployeePaymentRecords(
  employeeId: string,
  input: PaymentRecordFilters = {},
) {
  const pageSize = Math.min(Math.max(Number(input.limit || 25), 1), 200);
  const query: Record<string, any> = {
    ...ACTIVE_RECORD_FILTER,
    entity: employeeId,
  };
  await applyPaymentRecordFilters(query, input);
  const records = await findRecords(query, {
    populate: PAYMENT_POPULATE_FIELDS,
    sort: getPaymentSortMap(input.sort),
    skip: Number(input.pageNumber || 0) * pageSize,
    limit: pageSize + 1,
  });

  if (!records || records.length === 0) {
    return {
      message: "No records found",
      count: 0,
      records: [],
      balance: 0,
      totalIncome: 0,
      totalExpense: 0,
      totalTransactions: 0,
    };
  }

  const hasMore = records.length > pageSize;
  const transformedData = records.slice(0, pageSize).map(mapRecordListItem);
  const totals = await getEntityTotals(employeeId);

  return {
    count: transformedData.length,
    records: transformedData,
    ...totals,
    hasMore,
  };
}

export async function listIndividualPaymentRecords(
  employeeId: string,
  input: PaymentRecordFilters = {},
) {
  const pageSize = Math.min(Math.max(Number(input.limit || 25), 1), 200);
  const records = await findRecords(
    await applyPaymentRecordFilters(
      { ...ACTIVE_RECORD_FILTER, entity: employeeId },
      input,
    ),
    {
      populate: PAYMENT_POPULATE_FIELDS,
      sort: getPaymentSortMap(input.sort),
      skip: Number(input.pageNumber || 0) * pageSize,
      limit: pageSize + 1,
    }
  );

  if (!records || records.length === 0) {
    return {
      message: "No records found",
      count: 0,
      records: [],
      balance: 0,
      totalIncome: 0,
      totalExpense: 0,
      totalTransactions: 0,
      hasMore: false,
    };
  }

  const hasMore = records.length > pageSize;
  const individualRecords = records.slice(0, pageSize);
  const transformedData = individualRecords.map(mapRecordListItem);
  const totals = await getEntityTotals(employeeId);

  return {
    count: transformedData.length,
    records: transformedData,
    ...totals,
    hasMore,
  };
}

export async function deletePaymentRecord(id: string, principal: TPrincipal) {
  const record = await findRecordById(id);
  if (!record) {
    return { status: 404, body: { error: "Record not found" } };
  }

  const linkedIds = await resolveLinkedRecordIds(record);
  const linkedRecords = await findRecords(
    { _id: { $in: linkedIds } },
    { select: "entity recordKind category" },
  );

  await updateManyRecords(
    { _id: { $in: linkedIds } },
    {
      deletedAt: new Date(),
      $push: {
        activityLog: {
          action: "delete",
          at: new Date(),
          by: principal.userId,
          byUsername: principal.username,
          byFullname: principal.fullname,
          details:
            linkedIds.length > 1
              ? "Linked transaction pair moved to bin"
              : "Transaction moved to bin",
        },
      },
    }
  );

  await refreshEntityStatsForRecordRows(linkedRecords);

  return { status: 200, body: { message: "data deleted" } };
}

export async function deleteSelfTransferByGroupId(groupId: string, principal: TPrincipal) {
  const normalizedGroupId = String(groupId || "").trim();

  if (!normalizedGroupId) {
    return { status: 400, body: { error: "Group ID is required" } };
  }

  const record = await findOneRecord({
    ...ACTIVE_RECORD_FILTER,
    recordKind: "self_transfer",
    transferGroupId: normalizedGroupId,
  });

  if (!record) {
    return { status: 404, body: { error: "Self transfer group not found" } };
  }

  const linkedIds = await resolveLinkedRecordIds(record);
  const linkedRecords = await findRecords(
    { _id: { $in: linkedIds } },
    { select: "entity recordKind category" },
  );

  await updateManyRecords(
    { _id: { $in: linkedIds } },
    {
      deletedAt: new Date(),
      $push: {
        activityLog: {
          action: "delete",
          at: new Date(),
          by: principal.userId,
          byUsername: principal.username,
          byFullname: principal.fullname,
          details: "Self transfer pair moved to bin",
        },
      },
    },
  );

  await refreshEntityStatsForRecordRows(linkedRecords);

  return { status: 200, body: { message: "Self transfer deleted", groupId: normalizedGroupId } };
}

export async function updatePaymentRecord(id: string, reqBody: any, principal: TPrincipal) {
  const {
    _id,
    __v,
    createdAt,
    updatedAt,
    createdBy,
    activityLog,
    deletedAt,
    ...safePayload
  } = reqBody || {};

  const existingRecord = await findRecordByIdLean(id);

  if (!existingRecord) {
    return { status: 404, body: { error: "Record not found" } };
  }

  const normalizedPayload = normalizeEntityFields(safePayload);

  const changedEntries = Object.entries(normalizedPayload).filter(([key, nextValue]) => {
    const currentValue = (existingRecord as any)[key];
    return !areValuesEqual(nextValue, currentValue);
  });

  const editedFields = changedEntries.map(([key]) => key);

  if (editedFields.length === 0) {
    return {
      status: 200,
      body: {
        message: "No changes detected",
        data: existingRecord,
      },
    };
  }

  const changedPayload = Object.fromEntries(changedEntries);
  const previousValues = Object.fromEntries(
    changedEntries.map(([key]) => [key, (existingRecord as any)[key]])
  );
  const newValues = Object.fromEntries(changedEntries.map(([key, nextValue]) => [key, nextValue]));

  const data = await updateRecordById(
    id,
    {
      ...changedPayload,
      $inc: { __v: 1 },
      $push: {
        activityLog: {
          action: "update",
          at: new Date(),
          by: principal.userId,
          byUsername: principal.username,
          byFullname: principal.fullname,
          details: editedFields.length
            ? `Updated fields: ${editedFields.join(", ")}`
            : "Transaction updated",
          previousValues,
          newValues,
        },
      },
    },
    { new: true }
  );

  await refreshEntityStatsForRecordRows([
    existingRecord,
    data,
    {
      entity: normalizedPayload?.entity,
      recordKind: normalizedPayload?.recordKind,
      category: normalizedPayload?.category,
    },
  ]);

  const creatorId = existingRecord.createdBy?.toString?.();
  if (data && creatorId && creatorId !== principal.userId) {
    await createPaymentEditNotification({
      user: creatorId,
      type: "payment_edited",
      title: "Payment record edited",
      message: `${principal.fullname || principal.username || "A user"} changed ${editedFields.length} field${editedFields.length === 1 ? "" : "s"} on ${(existingRecord as any).suffix || ""}${(existingRecord as any).number || ""}.`,
      createdBy: principal.userId,
      entityType: "payment",
      entityId: id,
    });
  }

  return { status: 200, body: { message: "data updated", data } };
}

export async function recoverPaymentRecord(id: string, principal: TPrincipal) {
  const record = await findRecordById(id);
  if (!record) {
    return { status: 404, body: { error: "Record not found" } };
  }

  const linkedIds = await resolveLinkedRecordIds(record, true);
  const linkedRecords = await findRecords(
    { _id: { $in: linkedIds } },
    { select: "entity recordKind category" },
  );

  const data = await updateManyRecords(
    { _id: { $in: linkedIds } },
    {
      deletedAt: null,
      $push: {
        activityLog: {
          action: "recover",
          at: new Date(),
          by: principal.userId,
          byUsername: principal.username,
          byFullname: principal.fullname,
          details:
            linkedIds.length > 1
              ? "Linked transaction pair recovered from bin"
              : "Transaction recovered from bin",
        },
      },
    }
  );

  await refreshEntityStatsForRecordRows(linkedRecords);

  return { status: 200, body: { message: "Record recovered", data } };
}

/**
 * Computes comprehensive monthly financial statistics including:
 * - Total transaction count for the month
 * - Office records income and expense
 * - Profit (sum of service fees from entity records)
 * - Net profit (profit - office expense)
 * - Payment method breakdown (income, expense, balance per method, excluding service fees)
 * - Includes self-transfer transactions
 */
export async function computeMonthlyFinanceStats(year?: number, month?: number) {
  // Determine the month to compute
  const now = new Date();
  const computeYear = year || now.getFullYear();
  const computeMonth = month || now.getMonth() + 1;

  // Validate month is 1-12
  if (computeMonth < 1 || computeMonth > 12) {
    throw new Error(`Invalid month: ${computeMonth}. Month must be between 1 and 12`);
  }

  // Calculate month boundaries
  const monthStart = new Date(computeYear, computeMonth - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(computeYear, computeMonth, 1, 0, 0, 0, 0);

  const dateMatch = {
    createdAt: {
      $gte: monthStart,
      $lt: monthEnd,
    },
    deletedAt: null,
  };

  // 1. Count total transactions for the month (all record kinds including self_transfer)
  const totalTransactionCount = await countRecordsByQuery(dateMatch);

  // 2. Aggregate office records for income and expense
  const officeRecordsAgg = await aggregateRecords([
    {
      $match: {
        ...dateMatch,
        recordKind: "office_records",
      },
    },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
          },
        },
        totalExpense: {
          $sum: {
            $cond: [
              { $eq: ["$type", "expense"] },
              {
                $add: ["$amount", { $ifNull: ["$serviceFee", 0] }],
              },
              0,
            ],
          },
        },
      },
    },
  ]);

  const officeRecordsData = officeRecordsAgg[0] || {
    totalIncome: 0,
    totalExpense: 0,
  };

  // 2a. Aggregate office records by category (income + expense)
  const officeRecordsByCategoryAgg = await aggregateRecords([
    {
      $match: {
        ...dateMatch,
        recordKind: "office_records",
      },
    },
    {
      $group: {
        _id: "$category",
        incomeTotal: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
          },
        },
        expenseTotal: {
          $sum: {
            $cond: [
              { $eq: ["$type", "expense"] },
              { $add: ["$amount", { $ifNull: ["$serviceFee", 0] }] },
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: "officeExpenseCategories",
        localField: "_id",
        foreignField: "_id",
        as: "categoryDoc",
      },
    },
    {
      $unwind: {
        path: "$categoryDoc",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: { expenseTotal: -1, incomeTotal: -1 },
    },
  ]);

  const officeRecordsByCategory = officeRecordsByCategoryAgg.map((row: any) => {
    const income = Number(row.incomeTotal || 0);
    const expense = Number(row.expenseTotal || 0);
    return {
      categoryId: String(row._id || ""),
      categoryLabel: String(row.categoryDoc?.category || "Unknown"),
      income: Number(income.toFixed(2)),
      expense: Number(expense.toFixed(2)),
      balance: Number((income - expense).toFixed(2)),
    };
  });

  // 3. Aggregate profit from entity records (sum of service fees)
  const profitAgg = await aggregateRecords([
    {
      $match: {
        ...dateMatch,
        recordKind: { $nin: ["office_records", "liability", "self_transfer"] },
        type: "expense",
      },
    },
    {
      $group: {
        _id: null,
        totalServiceFee: {
          $sum: { $ifNull: ["$serviceFee", 0] },
        },
      },
    },
  ]);

  const profitData = profitAgg[0] || { totalServiceFee: 0 };
  const profit = Number(profitData.totalServiceFee || 0);
  const netProfit = profit - Number(officeRecordsData.totalExpense || 0);

  // 4. Aggregate payment methods breakdown.
  // Balance carries forward from the previous month: prevBalance + income - expense.
  const previousMonth = computeMonth === 1 ? 12 : computeMonth - 1;
  const previousYear = computeMonth === 1 ? computeYear - 1 : computeYear;
  const previousMonthlyStats = await findMonthlyFinanceStatsByYearMonth(previousYear, previousMonth);
  const previousBalancesByMethodId = new Map<string, { balance: number; methodLabel?: string }>(
    ((previousMonthlyStats as any)?.paymentMethods || []).map((row: any) => [
      String(row?.methodId || ""),
      {
        balance: Number(row?.balance || 0),
        methodLabel: String(row?.methodLabel || ""),
      },
    ]),
  );

  const paymentMethodsAgg = await aggregateRecords([
    {
      $match: dateMatch,
    },
    {
      $group: {
        _id: {
          methodId: "$method",
        },
        incomeTotal: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
          },
        },
        expenseTotal: {
          $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
          },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { incomeTotal: -1, expenseTotal: -1 },
    },
  ]);

  // Build payment methods array with labels and carried-forward balances
  const paymentMethodsMap = new Map<string, any>();
  const methods = await findPaymentTemplateMethods();
  const methodTemplatesById = new Map(
    (methods as any[]).map((m: any) => [String(m._id), m]),
  );

  const currentTotalsByMethodId = new Map<string, { income: number; expense: number }>();
  for (const row of paymentMethodsAgg) {
    const methodId = String(row._id?.methodId || "");
    currentTotalsByMethodId.set(methodId, {
      income: Number(row.incomeTotal || 0),
      expense: Number(row.expenseTotal || 0),
    });
  }

  const allMethodIds = Array.from(new Set<string>([
    ...Array.from(previousBalancesByMethodId.keys()),
    ...Array.from(currentTotalsByMethodId.keys()),
  ]));

  for (const methodId of allMethodIds) {
    const method = methodTemplatesById.get(methodId);
    const previous = previousBalancesByMethodId.get(methodId);
    const current = currentTotalsByMethodId.get(methodId) || { income: 0, expense: 0 };
    const prevBalance = Number(previous?.balance || 0);
    const currentIncome = Number(current.income || 0);
    const currentExpense = Number(current.expense || 0);
    const methodLabel = method?.method || previous?.methodLabel || methodId || "Unknown";

    paymentMethodsMap.set(methodId, {
      methodId,
      methodLabel,
      income: Number(currentIncome.toFixed(2)),
      expense: Number(currentExpense.toFixed(2)),
      balance: Number((prevBalance + currentIncome - currentExpense).toFixed(2)),
    });
  }

  // Build final response
  const monthlyStats = {
    year: computeYear,
    month: computeMonth,
    totalTransactions: totalTransactionCount,
    officeRecords: {
      totalIncome: Number((officeRecordsData.totalIncome || 0).toFixed(2)),
      totalExpense: Number((officeRecordsData.totalExpense || 0).toFixed(2)),
      byCategory: officeRecordsByCategory,
    },
    profit: Number(profit.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    paymentMethods: Array.from(paymentMethodsMap.values()),
  };

  // Persist to database
  await upsertMonthlyFinanceStats(computeYear, computeMonth, monthlyStats);

  return monthlyStats;
}

/**
 * Backfills monthly statistics for all historical months from the earliest
 * record in the database to the current month.
 * 
 * @param startYear - Optional year to start backfill from (defaults to first record)
 * @param startMonth - Optional month to start backfill from
 * @returns { totalMonths, computedMonths, errors, summary }
 */
export async function backfillMonthlyFinanceStats(startYear?: number, startMonth?: number) {
  const now = new Date();
  
  // Find the earliest record in the database
  const earliestRecord = await findOneRecord({ deletedAt: null }, "createdAt", { createdAt: 1 });
  if (!earliestRecord) {
    return {
      totalMonths: 0,
      computedMonths: 0,
      errors: ["No records found in database"],
      summary: "No data to backfill",
    };
  }

  // Determine start date
  const earliestDate = new Date(earliestRecord.createdAt);
  let startDate: Date;

  if (startYear && startMonth) {
    if (startMonth < 1 || startMonth > 12) {
      throw new Error("Invalid month. Must be between 1 and 12");
    }
    startDate = new Date(startYear, startMonth - 1, 1);
  } else {
    // Start from the month of the earliest record
    startDate = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
  }

  // Generate all months between startDate and current month
  const months: Array<{ year: number; month: number }> = [];
  let currentDate = new Date(startDate);

  while (currentDate < now) {
    months.push({
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,
    });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Also include current month
  months.push({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  // Remove duplicates
  const uniqueMonths = Array.from(
    new Map(months.map((m) => [`${m.year}-${m.month}`, m])).values()
  );

  const errors: string[] = [];
  let computedCount = 0;

  // Compute each month
  for (const { year, month } of uniqueMonths) {
    try {
      await computeMonthlyFinanceStats(year, month);
      computedCount++;
    } catch (error: any) {
      errors.push(`Failed to compute ${year}-${String(month).padStart(2, "0")}: ${error?.message}`);
    }
  }

  return {
    totalMonths: uniqueMonths.length,
    computedMonths: computedCount,
    errors,
    summary: `Successfully computed ${computedCount} out of ${uniqueMonths.length} months${
      errors.length > 0 ? ` with ${errors.length} errors` : ""
    }`,
  };
}
