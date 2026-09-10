export const SERVICE_KINDS = ["visa", "license", "other"] as const;

export type ServiceKind = (typeof SERVICE_KINDS)[number];

export const DEFAULT_SERVICE_KIND: ServiceKind = "other";

export const SERVICE_KIND_LABELS: Record<ServiceKind, string> = {
  visa: "Visa related",
  license: "License related",
  other: "Other",
};

export const SERVICE_KIND_SHORT_LABELS: Record<ServiceKind, string> = {
  visa: "Visa",
  license: "License",
  other: "General",
};

export const SERVICE_KIND_ACCENTS: Record<ServiceKind, string> = {
  visa: "#2563EB",
  license: "#7C3AED",
  other: "#0891B2",
};

export const SERVICE_KIND_OPTIONS: Array<{ value: ServiceKind; label: string }> =
  SERVICE_KINDS.map((value) => ({ value, label: SERVICE_KIND_LABELS[value] }));

export function normalizeServiceKind(value: unknown): ServiceKind {
  const next = String(value || "")
    .trim()
    .toLowerCase();
  return (SERVICE_KINDS as readonly string[]).includes(next)
    ? (next as ServiceKind)
    : DEFAULT_SERVICE_KIND;
}
