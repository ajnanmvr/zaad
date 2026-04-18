import { filterData } from "@/utils/filterData";
import { getRecordClient, mapRecordListItem, PAYMENT_POPULATE_FIELDS } from "@/app/api/payment/utils";
import { randomUUID } from "crypto";
import {
  aggregateRecords,
  createPaymentEditNotification,
  createRecord,
  distinctEmployeeIdsByCompany,
  findEntitiesByIds,
  findOneRecord,
  findPaymentTemplateMethods,
  findPaymentTemplateByMethodName,
  findPaymentStatusTemplateByStatusName,
  findPaymentStatusTemplates,
  findRecordById,
  findRecordByIdAndPopulate,
  findRecordByIdLean,
  findRecords,
  updateManyRecords,
  updateRecordById,
} from "@/repositories/paymentRepository";

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

function generateGroupId() {
  return randomUUID();
}

export function isAdminRole(role?: string) {
  const normalized = (role || "").toLowerCase();
  return normalized === "admin" || normalized === "superadmin";
}

async function resolveLinkedRecordIds(record: any, includeArchived = false) {
  if (!record?._id) {
    return [];
  }

  const recordId = String(record._id);
  const recordKind = String(record.recordKind || "").toLowerCase();
  const linkedIds = new Set<string>([recordId]);
  const publicationFilter = includeArchived ? {} : ACTIVE_RECORD_FILTER;

  if (recordKind === "self_transfer") {
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
      return Array.from(linkedIds);
    }

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

  if (recordKind === "instant_profit") {
    const recordNumber = Number(record.number);

    if (record.type === "income") {
      const partner = await findOneRecord(
        {
          ...publicationFilter,
          recordKind: "instant_profit",
          createdBy: record.createdBy,
          type: "expense",
          serviceFee: record.amount,
          amount: 0,
          number: Number.isFinite(recordNumber) ? recordNumber + 1 : undefined,
          _id: { $ne: record._id },
        },
        "_id"
      );

      if (partner) {
        linkedIds.add(String(partner._id));
      }
    }

    if (record.type === "expense") {
      const partner = await findOneRecord(
        {
          ...publicationFilter,
          recordKind: "instant_profit",
          createdBy: record.createdBy,
          type: "income",
          amount: record.serviceFee,
          number: Number.isFinite(recordNumber) ? recordNumber - 1 : undefined,
          _id: { $ne: record._id },
        },
        "_id"
      );

      if (partner) {
        linkedIds.add(String(partner._id));
      }
    }
  }

  return Array.from(linkedIds);
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

  return data;
}

export async function listPaymentRecords(input: {
  pageNumber: number;
  method?: string | null;
  type?: string | null;
  category?: string | null;
}) {
  const contentPerSection = 25;
  const query: Record<string, any> = { ...ACTIVE_RECORD_FILTER };

  if (input.method) {
    query.method = await resolveMethodFilter(input.method);
  }
  if (input.type) {
    query.type = input.type;
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

  const records = await findRecords(query, {
    populate: PAYMENT_POPULATE_FIELDS,
    skip: input.pageNumber * contentPerSection,
    limit: contentPerSection + 1,
    sort: { createdAt: -1 },
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

  await createRecord({
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

  await createRecord({
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
  const start = input.pageNumber * contentPerSection;
  const transformedData = groupedTransfers.slice(start, start + contentPerSection);
  const hasMore = groupedTransfers.length > start + contentPerSection;
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

  return {
    count: transformedData.length,
    hasMore,
    records: transformedData,
    balance: totalIncome - totalExpense,
    totalIncome,
    totalExpense,
    totalTransactions: groupedTransfers.length,
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
  const transferGroupId = generateGroupId();

  const normalizedPayload = normalizeEntityFields({
    ...reqBody,
    recordKind: "instant_profit",
    transferGroupId,
  });

  if (profitStatusTemplate) {
    normalizedPayload.status = profitStatusTemplate._id;
  }

  await createRecord({
    ...normalizedPayload,
    transferGroupId,
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

  await createRecord({
    ...rest,
    // Mirror expense carries the income amount as service fee.
    serviceFee: Number(originalAmount || 0),
    amount: 0,
    type: "expense",
    recordKind: "instant_profit",
    method: mirrorMethod,
    number: +number + 1,
    transferGroupId,
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

function aggregateEntityBalances(
  rows: Array<{
    entityId: string;
    entityName: string;
    balance: number;
    serviceFee: number;
    lastActivityAt?: string | Date | null;
  }>
) {
  const over0balance: any[] = [];
  const under0balance: any[] = [];

  let totalProfitAll = 0;
  let totalToGive = 0;
  let totalToGet = 0;

  for (const row of rows) {
    if (row.balance > 0) {
      over0balance.push({
        id: row.entityId,
        name: row.entityName,
        balance: row.balance,
        serviceFee: row.serviceFee,
        lastActivityAt: row.lastActivityAt,
      });
      totalProfitAll += row.serviceFee;
      totalToGive += row.balance;
    } else if (row.balance < 0) {
      under0balance.push({
        id: row.entityId,
        name: row.entityName,
        balance: row.balance,
        serviceFee: row.serviceFee,
        lastActivityAt: row.lastActivityAt,
      });
      totalToGet += row.balance;
    }
  }

  over0balance.sort((a, b) => a.name.localeCompare(b.name));
  under0balance.sort((a, b) => a.name.localeCompare(b.name));

  return { over0balance, under0balance, totalProfitAll, totalToGive, totalToGet };
}

export async function listProfitBalances(searchParams: URLSearchParams) {
  const filter = filterData(searchParams, true);
  const groupedBalances = await aggregateRecords<any>([
    { $match: { ...filter, deletedAt: null } },
    {
      $project: {
        type: 1,
        amount: { $ifNull: ["$amount", 0] },
        serviceFee: { $ifNull: ["$serviceFee", 0] },
        createdAt: 1,
        entityRef: "$entity",
      },
    },
    { $match: { entityRef: { $ne: null } } },
    {
      $group: {
        _id: { entityId: "$entityRef" },
        incomeTotal: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
        expenseTotal: {
          $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, { $add: ["$amount", "$serviceFee"] }, 0],
          },
        },
        serviceFee: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$serviceFee", 0] } },
        lastActivityAt: { $max: "$createdAt" },
      },
    },
    {
      $addFields: {
        balance: { $subtract: ["$incomeTotal", "$expenseTotal"] },
      },
    },
  ]);

  if (!groupedBalances.length) {
    return {
      over0balanceCompanies: [],
      under0balanceCompanies: [],
      totalProfitAllCompanies: 0,
      totalToGiveCompanies: 0,
      totalToGetCompanies: 0,
      over0balanceEmployees: [],
      under0balanceEmployees: [],
      totalProfitAllEmployees: 0,
      totalToGiveEmployees: 0,
      totalToGetEmployees: 0,
      over0balanceIndividuals: [],
      under0balanceIndividuals: [],
      totalProfitAllIndividuals: 0,
      totalToGiveIndividuals: 0,
      totalToGetIndividuals: 0,
      profit: 0,
      totalToGive: 0,
      totalToGet: 0,
    };
  }

  const ids = groupedBalances.map((row: any) => row._id.entityId);
  const entities = await findEntitiesByIds(ids);
  const entityById = new Map((entities as any[]).map((entity: any) => [String(entity._id), entity]));

  const companyRows: any[] = [];
  const employeeRows: any[] = [];
  const individualRows: any[] = [];

  for (const row of groupedBalances as any[]) {
    const entityId = String(row._id.entityId);
    const entity = entityById.get(entityId);
    if (!entity) continue;

    const payload = {
      entityId,
      entityName: entity.name,
      balance: row.balance,
      serviceFee: row.serviceFee,
      lastActivityAt: row.lastActivityAt,
    };

    if (entity.entityType === "company") {
      companyRows.push(payload);
    } else if (entity.entityType === "employee") {
      employeeRows.push(payload);
    } else if (entity.entityType === "individual") {
      individualRows.push(payload);
    }
  }

  const companies = aggregateEntityBalances(companyRows);
  const employees = aggregateEntityBalances(employeeRows);
  const individuals = aggregateEntityBalances(individualRows);

  const profit =
    employees.totalProfitAll + companies.totalProfitAll + individuals.totalProfitAll;
  const totalToGive =
    companies.totalToGive + employees.totalToGive + individuals.totalToGive;
  const totalToGet =
    companies.totalToGet + employees.totalToGet + individuals.totalToGet;

  return {
    over0balanceCompanies: companies.over0balance,
    under0balanceCompanies: companies.under0balance,
    totalProfitAllCompanies: companies.totalProfitAll,
    totalToGiveCompanies: companies.totalToGive,
    totalToGetCompanies: companies.totalToGet,
    over0balanceEmployees: employees.over0balance,
    under0balanceEmployees: employees.under0balance,
    totalProfitAllEmployees: employees.totalProfitAll,
    totalToGiveEmployees: employees.totalToGive,
    totalToGetEmployees: employees.totalToGet,
    over0balanceIndividuals: individuals.over0balance,
    under0balanceIndividuals: individuals.under0balance,
    totalProfitAllIndividuals: individuals.totalProfitAll,
    totalToGiveIndividuals: individuals.totalToGive,
    totalToGetIndividuals: individuals.totalToGet,
    profit,
    totalToGive,
    totalToGet,
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

export async function listCompanyPaymentRecords(companyId: string, recordScope: "company" | "employees" | "mixed") {
  const employeeIds = await distinctEmployeeIdsByCompany(companyId);
  const query: Record<string, any> = { ...ACTIVE_RECORD_FILTER };

  if (recordScope === "employees") {
    query.entity = { $in: employeeIds };
  } else if (recordScope === "mixed") {
    query.entity = { $in: [companyId, ...employeeIds] };
  } else {
    query.entity = companyId;
  }

  const records = await findRecords(query, {
    populate: PAYMENT_POPULATE_FIELDS,
    sort: { createdAt: -1 },
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

  const transformedData = records.map(mapRecordListItem);
  const allRecords = await findRecords(query);
  const totals = buildTotals(allRecords);

  return {
    count: transformedData.length,
    records: transformedData,
    ...totals,
    hasMore: false,
  };
}

export async function listEmployeePaymentRecords(employeeId: string) {
  const query = {
    ...ACTIVE_RECORD_FILTER,
    entity: employeeId,
  };
  const records = await findRecords(query, {
    populate: PAYMENT_POPULATE_FIELDS,
    sort: { createdAt: -1 },
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

  const transformedData = records.map(mapRecordListItem);
  const allRecords = await findRecords(query);
  const totals = buildTotals(allRecords);

  return {
    count: transformedData.length,
    records: transformedData,
    ...totals,
  };
}

export async function listIndividualPaymentRecords(employeeId: string) {
  const records = await findRecords(
    { ...ACTIVE_RECORD_FILTER, entity: employeeId },
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
      totalExpense: 0,
      totalTransactions: 0,
    };
  }

  const individualRecords = records.filter((record: any) => {
    const resolvedType = String(record?.entity?.entityType || "").toLowerCase();
    return resolvedType === "individual";
  });

  const transformedData = individualRecords.map(mapRecordListItem);
  const totals = buildTotals(individualRecords);

  return {
    count: transformedData.length,
    records: transformedData,
    ...totals,
  };
}

export async function deletePaymentRecord(id: string, principal: TPrincipal) {
  const record = await findRecordById(id);
  if (!record) {
    return { status: 404, body: { error: "Record not found" } };
  }

  const linkedIds = await resolveLinkedRecordIds(record);
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

  return { status: 200, body: { message: "data deleted" } };
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

  return { status: 200, body: { message: "Record recovered", data } };
}
