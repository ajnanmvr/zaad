import type { IconType } from "react-icons";
import { FiFileText, FiGlobe, FiShield } from "react-icons/fi";

export const DOCUMENT_CATEGORY_OPTIONS = [
  { value: "visa", label: "Visa Related" },
  { value: "license", label: "License Related" },
  { value: "other", label: "Other" },
] as const;

export type TDocumentCategory = (typeof DOCUMENT_CATEGORY_OPTIONS)[number]["value"];

export function normalizeDocumentCategory(value?: string | null): TDocumentCategory {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "visa") {
    return "visa";
  }
  if (normalized === "license") {
    return "license";
  }
  return "other";
}

export function getDocumentCategoryLabel(value?: string | null): string {
  const normalized = normalizeDocumentCategory(value);
  const option = DOCUMENT_CATEGORY_OPTIONS.find((item) => item.value === normalized);
  return option?.label || "Other";
}

export function getDocumentCategoryIcon(value?: string | null): IconType {
  const normalized = normalizeDocumentCategory(value);

  if (normalized === "visa") {
    return FiGlobe;
  }
  if (normalized === "license") {
    return FiShield;
  }
  return FiFileText;
}
