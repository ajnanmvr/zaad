// Job categories used when creating a job (title suggestions are managed in Settings > Job Titles).
// The category drives the Job ID code: ZD-<yy>-<code>-<number>, e.g. ZD-26-TL-1043 / ZD-26-VS-1044.

export type JobCategory = "license" | "visa";

export const JOB_CATEGORIES: Array<{ value: JobCategory; label: string; code: string }> = [
  { value: "license", label: "License", code: "TL" },
  { value: "visa", label: "Visa", code: "VS" },
];

export const JOB_CATEGORY_CODES: Record<JobCategory, string> = {
  license: "TL",
  visa: "VS",
};

export function getJobCategoryLabel(category?: string) {
  return JOB_CATEGORIES.find((item) => item.value === category)?.label || "";
}
