"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  FiClipboard,
  FiEdit2,
  FiFileText,
  FiFolder,
  FiKey,
  FiList,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";

export type EntityType = "company" | "employee" | "individual";
export type EntitySectionKey =
  | "overview"
  | "details"
  | "documents"
  | "credentials"
  | "handovers"
  | "employees"
  | "records"
  | "invoices";

export type EntityMetric = {
  icon: ReactNode;
  label: string;
  value: number;
};

export type EntityProfileLink = {
  href: string;
  label: string;
  active: boolean;
};

export function initialsFromName(name?: string) {
  if (!name) return "EN";

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "EN";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export function hasValue(value?: string | number | boolean | null) {
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return !Number.isNaN(value);

  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function resolveAvatarColor(preferredColor?: string) {
  const color = preferredColor?.trim();

  if (color) {
    if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(color)) {
      return `#${color}`;
    }

    return color;
  }

  return "#3C50E0";
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function resolveAvatarColorWithFallback(preferredColor?: string, seed?: string) {
  const color = resolveAvatarColor(preferredColor);

  if (preferredColor?.trim()) {
    return color;
  }

  if (!seed?.trim()) {
    return color;
  }

  const hash = hashString(seed.trim().toLowerCase());
  const hue = hash % 360;

  return `hsl(${hue} 72% 45%)`;
}

export function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString();
}

export function getEntitySectionLinks(entityType: EntityType, id: string): EntityProfileLink[] {
  const links: EntityProfileLink[] = [
    {
      href: `/${entityType}/${id}/details`,
      label: "Details",
      active: false,
    },
    {
      href: `/${entityType}/${id}/documents`,
      label: "Documents",
      active: false,
    },
    {
      href: `/${entityType}/${id}/credentials`,
      label: "Credentials",
      active: false,
    },
    {
      href: `/${entityType}/${id}/handovers`,
      label: "Handovers",
      active: false,
    },
  ];

  if (entityType === "company") {
    links.push(
      {
        href: `/${entityType}/${id}/employees`,
        label: "Employees",
        active: false,
      },
      {
        href: `/${entityType}/${id}/records`,
        label: "Records",
        active: false,
      },
      {
        href: `/${entityType}/${id}/invoices`,
        label: "Invoices",
        active: false,
      },
    );
  } else {
    links.push(
      {
        href: `/${entityType}/${id}/records`,
        label: "Records",
        active: false,
      },
      {
        href: `/${entityType}/${id}/invoices`,
        label: "Invoices",
        active: false,
      },
    );
  }

  return links;
}

export function getSectionTitle(section: EntitySectionKey) {
  switch (section) {
    case "overview":
      return "Overview";
    case "details":
      return "Details";
    case "documents":
      return "Documents";
    case "credentials":
      return "Credentials";
    case "handovers":
      return "Handovers";
    case "employees":
      return "Employees";
    case "records":
      return "Records";
    case "invoices":
      return "Invoices";
  }
}

export function EntityProfileHeader({
  entityType,
  name,
  avatarInitials,
  avatarColor,
  companyName,
  companyAvatarInitials,
  companyAvatarColor,
  onEditHref,
  onDelete,
  isDeleting,
}: {
  entityType: EntityType;
  name: string;
  avatarInitials: string;
  avatarColor: string;
  companyName?: string;
  companyAvatarInitials?: string;
  companyAvatarColor?: string;
  onEditHref: string;
  onDelete: () => void;
  isDeleting?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(60,80,224,0.12),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.08),_transparent_30%)]" />
      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.5rem] text-2xl font-black text-white ring-4 ring-white/40 dark:ring-slate-950/40"
              style={{ backgroundColor: avatarColor }}
            >
              {avatarInitials}
            </div>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white dark:bg-white dark:text-slate-900">
                  {entityType}
                </span>
                {companyName && companyAvatarInitials && companyAvatarColor && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white"
                      style={{ backgroundColor: companyAvatarColor }}
                    >
                      {companyAvatarInitials}
                    </span>
                    {companyName}
                  </span>
                )}
              </div>
              <h1 className="truncate text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                {name}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 sm:justify-end">
            <Link
              href={onEditHref || "#"}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <FiEdit2 className="mr-2" />
              Edit profile
            </Link>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiTrash2 className="mr-2" />
              {isDeleting ? "Deleting..." : "Delete profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EntityProfileTabs({
  entityType,
  id,
  activeSection,
  sectionCounts,
}: {
  entityType: EntityType;
  id: string;
  activeSection: EntitySectionKey;
  sectionCounts?: Partial<Record<EntitySectionKey, number>>;
}) {
  const sectionIcons: Record<EntitySectionKey, ReactNode> = {
    overview: <FiClipboard className="text-base" />,
    details: <FiClipboard className="text-base" />,
    documents: <FiFolder className="text-base" />,
    credentials: <FiKey className="text-base" />,
    handovers: <FiFileText className="text-base" />,
    employees: <FiUsers className="text-base" />,
    records: <FiList className="text-base" />,
    invoices: <FiFileText className="text-base" />,
  };

  const links = getEntitySectionLinks(entityType, id).map((link) => ({
    ...link,
    active: link.label.toLowerCase() === activeSection,
  }));

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          (() => {
            const sectionKey = link.label.toLowerCase() as EntitySectionKey;
            const count = sectionCounts?.[sectionKey] || 0;
            const showCount =
              sectionKey !== "records" &&
              sectionKey !== "invoices" &&
              count > 0;

            return (
          <Link
            key={link.label}
            href={link.href}
            aria-current={link.active ? "page" : undefined}
            className={
              link.active
                ? "inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
                : "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            }
          >
            {sectionIcons[sectionKey]}
            {link.label}
            {showCount && (
              <span
                className={
                  link.active
                    ? "inline-flex min-w-6 items-center justify-center rounded-full bg-white/20 px-1.5 py-0.5 text-[11px] font-bold dark:bg-slate-900/20"
                    : "inline-flex min-w-6 items-center justify-center rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100"
                }
              >
                {count}
              </span>
            )}
          </Link>
            );
          })()
        ))}
      </div>
    </div>
  );
}

export function ProfileField({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean;
}) {
  if (!hasValue(value)) return null;

  const displayValue = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-700 dark:bg-slate-800/30">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 font-semibold text-slate-900 dark:text-slate-100">
        {displayValue}
      </p>
    </div>
  );
}

export function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/35">
      <div className="mb-2 inline-flex rounded-xl bg-white p-2 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-700">
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-6">
      {(title || description) && (
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/70 ${className}`} />;
}

export function EntityProfileSkeleton({ entityType }: { entityType: EntityType }) {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
            <SkeletonBlock className="h-24 w-24 rounded-[1.75rem]" />
            <div className="space-y-4">
              <div className="space-y-3">
                <SkeletonBlock className="h-6 w-32 rounded-full" />
                <div className="space-y-3">
                  <SkeletonBlock className="h-10 w-72 max-w-full rounded-xl" />
                  <SkeletonBlock className="h-4 w-[28rem] max-w-full rounded-xl" />
                  <SkeletonBlock className="h-4 w-[22rem] max-w-full rounded-xl" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <SkeletonBlock className="h-9 w-28 rounded-full" />
                <SkeletonBlock className="h-9 w-24 rounded-full" />
              </div>

              <div className="flex flex-wrap gap-3">
                <SkeletonBlock className="h-11 w-32 rounded-xl" />
                <SkeletonBlock className="h-11 w-28 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-xl xl:grid-cols-2">
            <SkeletonBlock className="h-28 rounded-2xl" />
            <SkeletonBlock className="h-28 rounded-2xl" />
            <SkeletonBlock className="h-28 rounded-2xl" />
            <SkeletonBlock className="h-28 rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-wrap gap-2">
          <SkeletonBlock className="h-11 w-24 rounded-full" />
          <SkeletonBlock className="h-11 w-24 rounded-full" />
          <SkeletonBlock className="h-11 w-28 rounded-full" />
          <SkeletonBlock className="h-11 w-28 rounded-full" />
          <SkeletonBlock className="h-11 w-28 rounded-full" />
          {entityType === "company" && <SkeletonBlock className="h-11 w-28 rounded-full" />}
          <SkeletonBlock className="h-11 w-28 rounded-full" />
          <SkeletonBlock className="h-11 w-28 rounded-full" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-6">
          <SectionCard title="Loading" description="Fetching profile data...">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <SkeletonBlock className="h-20 rounded-2xl" />
              <SkeletonBlock className="h-20 rounded-2xl" />
              <SkeletonBlock className="h-20 rounded-2xl" />
              <SkeletonBlock className="h-20 rounded-2xl" />
              <SkeletonBlock className="h-20 rounded-2xl" />
              <SkeletonBlock className="h-20 rounded-2xl" />
            </div>
          </SectionCard>

          <SectionCard title="Loading" description="Preparing related records...">
            <div className="space-y-3">
              <SkeletonBlock className="h-20 rounded-2xl" />
              <SkeletonBlock className="h-20 rounded-2xl" />
              <SkeletonBlock className="h-20 rounded-2xl" />
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 self-start">
          <SectionCard title="Loading" description="Snapshot and status are loading...">
            <div className="space-y-3">
              <SkeletonBlock className="h-16 rounded-2xl" />
              <SkeletonBlock className="h-16 rounded-2xl" />
              <SkeletonBlock className="h-16 rounded-2xl" />
              <SkeletonBlock className="h-16 rounded-2xl" />
            </div>
          </SectionCard>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">
            <SkeletonBlock className="h-28 rounded-2xl" />
            <SkeletonBlock className="h-28 rounded-2xl" />
            <SkeletonBlock className="h-28 rounded-2xl" />
            <SkeletonBlock className="h-28 rounded-2xl" />
          </div>
        </aside>
      </div>
    </div>
  );
}

export function EntitySectionSkeleton({
  entityType,
  sectionTitle,
}: {
  entityType: EntityType;
  sectionTitle: string;
}) {
  return (
    <div className="space-y-6">
      <EntityProfileSkeleton entityType={entityType} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <SectionCard title={sectionTitle} description="Loading section content...">
          <div className="space-y-3">
            <SkeletonBlock className="h-20 rounded-2xl" />
            <SkeletonBlock className="h-20 rounded-2xl" />
            <SkeletonBlock className="h-20 rounded-2xl" />
            <SkeletonBlock className="h-20 rounded-2xl" />
          </div>
        </SectionCard>

        <aside className="space-y-6 xl:sticky xl:top-6 self-start">
          <SectionCard title="Loading" description="Snapshot and status are loading...">
            <div className="space-y-3">
              <SkeletonBlock className="h-16 rounded-2xl" />
              <SkeletonBlock className="h-16 rounded-2xl" />
              <SkeletonBlock className="h-16 rounded-2xl" />
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
