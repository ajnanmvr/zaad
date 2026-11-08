import JobTitleSuggestion from "@/models/jobTitleSuggestions";
import { JOB_CATEGORY_CODES, type JobCategory } from "@/config/jobTitleSuggestions";
import { ServiceError } from "./serviceError";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isCategory = (value: unknown): value is JobCategory =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(JOB_CATEGORY_CODES, value);

function mapSuggestion(doc: any) {
  return { id: String(doc._id), category: doc.category as JobCategory, title: doc.title as string };
}

export async function listJobTitleSuggestions(category?: string | null) {
  const filter: Record<string, unknown> = { published: true };
  if (category && isCategory(category)) filter.category = category;
  const rows = await JobTitleSuggestion.find(filter).sort({ category: 1, title: 1 }).lean();
  return rows.map(mapSuggestion);
}

function validate(input: any) {
  const category = input?.category;
  const title = String(input?.title ?? "").trim();
  if (!isCategory(category)) throw new ServiceError("Category must be license or visa", 400);
  if (!title) throw new ServiceError("Title is required", 400);
  if (title.length > 120) throw new ServiceError("Title is too long (max 120 characters)", 400);
  return { category, title };
}

async function assertUnique(category: JobCategory, title: string, excludeId?: string) {
  const existing = await JobTitleSuggestion.findOne({
    category,
    title: new RegExp(`^${escapeRegex(title)}$`, "i"),
    published: true,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).select("_id");
  if (existing) throw new ServiceError("This suggestion already exists in that category", 400);
}

export async function createJobTitleSuggestion(input: any) {
  const data = validate(input);
  await assertUnique(data.category, data.title);
  const created = await JobTitleSuggestion.create(data);
  return mapSuggestion(created.toObject());
}

export async function updateJobTitleSuggestion(id: string, input: any) {
  const data = validate(input);
  await assertUnique(data.category, data.title, id);
  const updated = await JobTitleSuggestion.findOneAndUpdate({ _id: id, published: true }, data, { new: true }).lean();
  if (!updated) throw new ServiceError("Suggestion not found", 404);
  return mapSuggestion(updated);
}

export async function deleteJobTitleSuggestion(id: string) {
  const removed = await JobTitleSuggestion.findOneAndUpdate({ _id: id, published: true }, { published: false });
  if (!removed) throw new ServiceError("Suggestion not found", 404);
}
