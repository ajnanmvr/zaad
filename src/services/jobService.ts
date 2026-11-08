import mongoose from "mongoose";
import Jobs, { Counters } from "@/models/jobs";
import { Entity } from "@/models/entities";
import Records from "@/models/records";
import { ServiceError } from "@/services/serviceError";

export type JobTotals = {
  totalIncome: number;
  totalExpense: number;
  totalServiceFee: number;
  net: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
};

const ZERO_TOTALS: JobTotals = {
  totalIncome: 0,
  totalExpense: 0,
  totalServiceFee: 0,
  net: 0,
  transactionCount: 0,
  incomeCount: 0,
  expenseCount: 0,
};

// Accepts either the Mongo _id or the human-readable jobId (JOB-0001).
const jobKey = (id: string) =>
  mongoose.isValidObjectId(id) ? { _id: id } : { jobId: id };

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function getTotalsByJobIds(jobIds: string[]): Promise<Map<string, JobTotals>> {
  const result = new Map<string, JobTotals>();
  if (jobIds.length === 0) return result;

  const rows = await Records.aggregate([
    { $match: { deletedAt: null, jobId: { $in: jobIds } } },
    {
      $group: {
        _id: { jobId: "$jobId", type: "$type" },
        amount: { $sum: "$amount" },
        serviceFee: { $sum: { $ifNull: ["$serviceFee", 0] } },
        count: { $sum: 1 },
      },
    },
  ]);

  for (const row of rows) {
    const key = row._id.jobId as string;
    const totals = result.get(key) || { ...ZERO_TOTALS };
    if (row._id.type === "income") {
      totals.totalIncome += row.amount;
      totals.incomeCount += row.count;
    } else {
      totals.totalExpense += row.amount;
      totals.expenseCount += row.count;
    }
    totals.totalServiceFee += row.serviceFee;
    totals.transactionCount += row.count;
    totals.net = totals.totalIncome - totals.totalExpense;
    result.set(key, totals);
  }

  return result;
}

function mapEntity(entity: any) {
  if (!entity || typeof entity !== "object" || !entity.name) return null;
  return {
    id: String(entity._id),
    name: entity.name as string,
    type: (entity.entityType || "company") as "company" | "employee" | "individual",
    color: entity.color as string | undefined,
    companyName:
      entity.entityType === "employee" && entity.company?.name
        ? (entity.company.name as string)
        : undefined,
    companyId:
      entity.entityType === "employee" && entity.company?._id
        ? String(entity.company._id)
        : undefined,
  };
}

function mapJob(job: any, totals?: JobTotals) {
  return {
    client: mapEntity(job.entity),
    id: String(job._id),
    jobId: job.jobId,
    title: job.title,
    description: job.description || "",
    status: job.status || "open",
    createdAt: job.createdAt,
    totals: totals || { ...ZERO_TOTALS },
  };
}

export async function listJobs(input: {
  query?: string | null;
  status?: string | null;
  entityId?: string | null;
  pageNumber?: number;
  limit?: number;
}) {
  const limit = Math.min(Math.max(Number(input.limit) || 25, 1), 200);
  const page = Math.max(Number(input.pageNumber) || 0, 0);
  const filter: Record<string, any> = { published: true };

  if (input.status === "open" || input.status === "closed") {
    filter.status = input.status;
  }
  if (input.entityId) {
    // Include jobs of the entity itself and, for a company, of its employees.
    const employees = await Entity.find({ company: input.entityId, published: true })
      .select("_id")
      .limit(500)
      .lean();
    filter.entity = { $in: [input.entityId, ...employees.map((e: any) => e._id)] };
  }
  if (input.query?.trim()) {
    const regex = new RegExp(escapeRegex(input.query.trim()), "i");
    const matchingEntities = await Entity.find({ name: regex, published: true }).select("_id").limit(100).lean();
    filter.$or = [
      { jobId: regex },
      { title: regex },
      { description: regex },
      { entity: { $in: matchingEntities.map((e: any) => e._id) } },
    ];
  }

  const jobs = await Jobs.find(filter)
    .sort({ createdAt: -1 })
    .skip(page * limit)
    .limit(limit + 1)
    .populate({ path: "entity", select: "name entityType color company", populate: { path: "company", select: "name", strictPopulate: false } })
    .lean();

  const hasMore = jobs.length > limit;
  const pageJobs = jobs.slice(0, limit);
  const totals = await getTotalsByJobIds(pageJobs.map((job: any) => job.jobId));

  return {
    hasMore,
    jobs: pageJobs.map((job: any) => mapJob(job, totals.get(job.jobId))),
  };
}

export async function getJob(id: string) {
  const job = await Jobs.findOne({ ...jobKey(id), published: true })
    .populate({ path: "entity", select: "name entityType color company", populate: { path: "company", select: "name", strictPopulate: false } })
    .lean();
  if (!job) throw new ServiceError("Job not found", 404);

  const totals = (await getTotalsByJobIds([(job as any).jobId])).get((job as any).jobId);

  // Per payment-method breakdown for the summary panel.
  const byMethod = await Records.aggregate([
    { $match: { deletedAt: null, jobId: (job as any).jobId } },
    {
      $group: {
        _id: { method: "$method", type: "$type" },
        amount: { $sum: "$amount" },
      },
    },
    {
      $lookup: {
        from: "paymenttemplates",
        localField: "_id.method",
        foreignField: "_id",
        as: "methodDoc",
      },
    },
    {
      $project: {
        _id: 0,
        type: "$_id.type",
        amount: 1,
        method: { $ifNull: [{ $arrayElemAt: ["$methodDoc.method", 0] }, "Unknown"] },
      },
    },
  ]);

  return { ...mapJob(job, totals), byMethod };
}

async function generateJobId() {
  // Atomic counter; skip any ID already used by a job or by legacy free-text record IDs.
  for (let attempt = 0; attempt < 50; attempt++) {
    const counter = await Counters.findOneAndUpdate(
      { _id: "jobId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    const candidate = `JOB-${String(counter.seq).padStart(4, "0")}`;
    const [jobTaken, recordTaken] = await Promise.all([
      Jobs.exists({ jobId: candidate }),
      Records.exists({ jobId: candidate }),
    ]);
    if (!jobTaken && !recordTaken) return candidate;
  }
  throw new ServiceError("Could not generate a unique Job ID", 500);
}

export async function createJob(input: any, userId?: string) {
  const title = String(input?.title ?? "").trim();
  const entityId = String(input?.entity ?? "").trim();
  if (!title) throw new ServiceError("Title is required", 400);
  if (!entityId) throw new ServiceError("Client is required", 400);

  const entity = await Entity.findById(entityId).select("_id").lean();
  if (!entity) throw new ServiceError("Client not found", 404);

  const job = await Jobs.create({
    jobId: await generateJobId(),
    title,
    description: String(input?.description ?? "").trim(),
    entity: entityId,
    createdBy: userId,
  });
  return mapJob(job.toObject());
}

export async function updateJob(id: string, input: any) {
  const current = await Jobs.findOne({ ...jobKey(id), published: true });
  if (!current) throw new ServiceError("Job not found", 404);

  // jobId is immutable: transactions reference it.
  const title = String(input?.title ?? current.title).trim();
  if (!title) throw new ServiceError("Title is required", 400);
  current.title = title;
  current.description = String(input?.description ?? current.description ?? "").trim();
  current.status = input?.status === "closed" ? "closed" : "open";

  const entityId = String(input?.entity ?? "").trim();
  if (entityId && entityId !== String(current.entity)) {
    const entity = await Entity.findById(entityId).select("_id").lean();
    if (!entity) throw new ServiceError("Client not found", 404);
    current.entity = entityId;
  }

  await current.save();
  return mapJob(current.toObject());
}

export async function deleteJob(id: string) {
  const job = await Jobs.findOneAndUpdate({ ...jobKey(id), published: true }, { published: false });
  if (!job) throw new ServiceError("Job not found", 404);
}
