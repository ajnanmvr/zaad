// Job categories and the title suggestions offered when creating a job.
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

export const JOB_TITLE_SUGGESTIONS: Record<JobCategory, string[]> = {
  license: [
    "Trade License Renewal",
    "New Trade License Issuance",
    "Trade License Amendment",
    "Trade Name Reservation / Initial Approval",
    "Add / Remove Business Activity",
    "Add / Remove Partner or Shareholder",
    "Change of Company Name",
    "Change of Legal Form",
    "Change of Office Address",
    "Ejari Registration / Renewal",
    "Civil Defense Certificate / Renewal",
    "Municipality / Food Permit Approval",
    "Chamber of Commerce Membership / Renewal",
    "Free Zone License Renewal",
    "Establishment Card Issuance / Renewal",
    "Memorandum of Association (MOA) Amendment",
    "Manager / Authorised Signatory Change",
    "Branch License Issuance",
    "License Cancellation",
    "Inspection / Clearance Follow-up",
  ],
  visa: [
    "Employment Visa - New",
    "Employment Visa - Renewal",
    "Visa Cancellation",
    "Change of Visa Status (Inside Country)",
    "Entry Permit (Outside Country)",
    "Visa Stamping",
    "Medical Fitness Test",
    "Emirates ID - New / Renewal",
    "Investor / Partner Visa",
    "Family / Dependent Visa",
    "Golden Visa",
    "Visit Visa",
    "Visit Visa Extension",
    "Work Permit / Labour Card - New / Renewal",
    "Labour Contract Update",
    "Visa Amendment (Passport / Profession)",
    "Medical Insurance",
    "Absconding Report / Cancellation",
    "Exit Permit / Out-pass",
  ],
};

export function getJobCategoryLabel(category?: string) {
  return JOB_CATEGORIES.find((item) => item.value === category)?.label || "";
}
