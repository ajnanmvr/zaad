"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiCheckCircle,
  FiCreditCard,
  FiFileText,
  FiFolder,
  FiGlobe,
  FiLayers,
  FiPhone,
  FiTag,
  FiUsers,
} from "react-icons/fi";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import HandoverList from "@/components/HandoverList";

type EntityType = "company" | "employee" | "individual";

type OverviewResponse = {
  data: {
    entity: {
      id: string;
      name: string;
      entityType: EntityType;
      email?: string;
      phone1?: string;
      phone2?: string;
      color?: string;
      company?: { id: string; name: string; color?: string };
    };
    counts: {
      details: number;
      documents: number;
      credentials: number;
      handovers: number;
      employees: number;
      invoices: number;
      records: number;
    };
  };
};

type EntityDetailsResponse = {
  data: {
    id: string;
    name: string;
    email?: string;
    phone1?: string;
    phone2?: string;
    licenseNo?: string;
    companyType?: string;
    emirates?: string;
    transactionNo?: string;
    isMainland?: boolean;
    emiratesId?: string;
    nationality?: string;
    designation?: string;
    remarks?: string;
    company?: { _id: string; name: string };
    documents?: Array<{
      _id: string;
      name?: string;
      expiryDate?: string;
      notes?: string;
    }>;
    credentials?: Array<{
      _id: string;
      platform?: string;
      username?: string;
      notes?: string;
    }>;
  };
};

function initialsFromName(name?: string) {
  if (!name) return "EN";
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "EN";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function hasValue(value?: string | number | boolean | null) {
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return !Number.isNaN(value);
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function resolveAvatarColor(preferredColor?: string) {
  const color = preferredColor?.trim();
  if (color) {
    if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(color)) {
      return `#${color}`;
    }
    return color;
  }
  return "#3C50E0";
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean;
}) {
  if (!hasValue(value)) return null;

  const displayValue =
    typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/30">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
        {displayValue}
      </p>
    </div>
  );
}

function MiniCountCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="mb-2 inline-flex rounded-xl bg-white p-2 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

export default function EntityOverviewHub({
  entityType,
  id,
}: {
  entityType: EntityType;
  id: string;
}) {
  const { data: overviewRes } = useQuery<OverviewResponse>({
    queryKey: ["entity-overview", entityType, id],
    queryFn: async () => {
      const res = await fetch(`/api/entity-overview/${entityType}/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch entity overview");
      }
      return res.json();
    },
  });

  const { data: detailRes, isLoading: detailLoading } =
    useQuery<EntityDetailsResponse>({
      queryKey: ["entity-detail", entityType, id],
      queryFn: async () => {
        const res = await fetch(`/api/${entityType}/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch entity details");
        }
        return res.json();
      },
    });

  const entity = overviewRes?.data.entity;
  const counts = overviewRes?.data.counts;
  const details = detailRes?.data;

  const documents = useMemo(
    () => detailRes?.data?.documents || [],
    [detailRes],
  );
  const credentials = useMemo(
    () => detailRes?.data?.credentials || [],
    [detailRes],
  );
  const avatarInitials = initialsFromName(entity?.name || details?.name);
  const avatarColor = resolveAvatarColor(entity?.color);
  const companyAvatarInitials = initialsFromName(
    entity?.company?.name || details?.company?.name,
  );
  const companyAvatarColor = resolveAvatarColor(entity?.company?.color);

  return (
    <>
      <Breadcrumb pageName={entity ? entity.name : `${entityType} profile`} />

      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-8">
          <div className="mb-2 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black text-white shadow-sm"
                style={{ backgroundColor: avatarColor }}
              >
                {avatarInitials}
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {detailLoading
                    ? "Loading entity..."
                    : details?.name || entity?.name || "Entity Profile"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {entityType === "company"
                    ? "Company profile, documents, handovers, credentials, and activity."
                    : "Entity profile, documents, handovers, credentials, and activity."}
                </p>
                {entityType === "employee" &&
                  hasValue(entity?.company?.name || details?.company?.name) && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: companyAvatarColor }}
                      >
                        {companyAvatarInitials}
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Company
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {entity?.company?.name || details?.company?.name}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-8">
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
            {entityType === "company" ? "Company Details" : "Entity Details"}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ProfileField label="Name" value={details?.name} />
            <ProfileField label="Email" value={details?.email} />
            <ProfileField label="Phone 1" value={details?.phone1} />
            <ProfileField label="Phone 2" value={details?.phone2} />

            {entityType === "company" && (
              <>
                <ProfileField label="License No" value={details?.licenseNo} />
                <ProfileField
                  label="Company Type"
                  value={details?.companyType}
                />
                <ProfileField label="Emirates" value={details?.emirates} />
                <ProfileField
                  label="Transaction No"
                  value={details?.transactionNo}
                />
                <ProfileField label="Mainland" value={details?.isMainland} />
              </>
            )}

            {entityType === "employee" && (
              <>
                <ProfileField label="Company" value={details?.company?.name} />
                <ProfileField label="Emirates ID" value={details?.emiratesId} />
                <ProfileField
                  label="Nationality"
                  value={details?.nationality}
                />
                <ProfileField
                  label="Designation"
                  value={details?.designation}
                />
              </>
            )}

            {entityType === "individual" && (
              <>
                <ProfileField label="Emirates ID" value={details?.emiratesId} />
                <ProfileField
                  label="Nationality"
                  value={details?.nationality}
                />
                <ProfileField
                  label="Designation"
                  value={details?.designation}
                />
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MiniCountCard
            icon={<FiFolder />}
            label="Documents"
            value={counts?.documents || 0}
          />
          <MiniCountCard
            icon={<FiFileText />}
            label="Handovers"
            value={counts?.handovers || 0}
          />
          <MiniCountCard
            icon={<FiLayers />}
            label="Credentials"
            value={counts?.credentials || 0}
          />
          {entityType === "company" && (
            <MiniCountCard
              icon={<FiUsers />}
              label="Employees"
              value={counts?.employees || 0}
            />
          )}
          {entityType !== "individual" && (
            <MiniCountCard
              icon={<FiCreditCard />}
              label="Invoices"
              value={counts?.invoices || 0}
            />
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-8">
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
            Documents
          </h3>
          <div className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-sm text-slate-500">No documents found.</p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc._id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/30"
                >
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {doc.name || "Untitled document"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Expiry: {formatDate(doc.expiryDate)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <HandoverList
          entityId={id}
          entityName={details?.name || entity?.name || "Entity"}
          entityType={entityType}
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-8">
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
            Credentials
          </h3>
          <div className="space-y-2">
            {credentials.length === 0 ? (
              <p className="text-sm text-slate-500">No credentials found.</p>
            ) : (
              credentials.map((item) => (
                <div
                  key={item._id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/30"
                >
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.platform || "Unknown platform"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Username: {item.username || "-"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-8">
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
            Other Information
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {hasValue(details?.remarks) && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/30">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Remarks
                </p>
                <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                  {details?.remarks}
                </p>
              </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/30">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Entity Type
              </p>
              <p className="mt-1 inline-flex items-center gap-2 font-semibold capitalize text-slate-800 dark:text-slate-200">
                <FiTag className="text-slate-400" />
                {entityType}
              </p>
            </div>
            {hasValue(details?.phone1 || details?.phone2) && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/30">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Primary Contact
                </p>
                <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <FiPhone className="text-slate-400" />
                  {details?.phone1 || details?.phone2}
                </p>
              </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/30">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Status
              </p>
              <p className="mt-1 inline-flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
                <FiCheckCircle />
                Active
              </p>
            </div>
            {entityType === "company" && hasValue(details?.emirates) && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/30">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Region
                </p>
                <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <FiGlobe className="text-slate-400" />
                  {details?.emirates}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
