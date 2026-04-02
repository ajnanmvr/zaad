"use client";

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
import {
  EntityProfileHeader,
  EntityProfileSkeleton,
  EntityProfileTabs,
  EntityType,
  EntityMetric,
  MetricCard,
  ProfileField,
  SectionCard,
  formatDate,
  hasValue,
  initialsFromName,
  resolveAvatarColorWithFallback,
} from "./EntityProfileFrame";

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
    color?: string;
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
    company?: { _id: string; name: string; color?: string };
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

function sectionDescription(entityType: EntityType) {
  return entityType === "company"
    ? "Company profile, records, credentials, and documents in one profile-style view."
    : "Profile overview, documents, handovers, credentials, and related activity.";
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
  const documents = detailRes?.data?.documents || [];
  const credentials = detailRes?.data?.credentials || [];
  const isLoading = !overviewRes || !detailRes;

  const avatarInitials = initialsFromName(entity?.name || details?.name);
  const avatarColor = resolveAvatarColorWithFallback(entity?.color || details?.color, entity?.name || details?.name);
  const companyName = entity?.company?.name || details?.company?.name;
  const companyAvatarInitials = initialsFromName(companyName);
  const companyAvatarColor = resolveAvatarColorWithFallback(
    entity?.company?.color || details?.company?.color,
    companyName,
  );

  const metrics: EntityMetric[] = [
    {
      icon: <FiFolder />,
      label: "Documents",
      value: counts?.documents || 0,
    },
    {
      icon: <FiFileText />,
      label: "Handovers",
      value: counts?.handovers || 0,
    },
    {
      icon: <FiLayers />,
      label: "Credentials",
      value: counts?.credentials || 0,
    },
  ];

  if (entityType === "company") {
    metrics.push({
      icon: <FiUsers />,
      label: "Employees",
      value: counts?.employees || 0,
    });
  } else {
    metrics.push({
      icon: <FiCreditCard />,
      label: "Invoices",
      value: counts?.invoices || 0,
    });
  }

  const actions = [
    {
      href: `/${entityType}/${id}/edit`,
      label: "Edit profile",
      primary: true,
    },
  ];

  return (
    <>
      <Breadcrumb pageName={entity ? entity.name : `${entityType} profile`} />

      {isLoading ? (
        <EntityProfileSkeleton entityType={entityType} />
      ) : (
        <div className="space-y-6">
          <EntityProfileHeader
            entityType={entityType}
            name={detailLoading ? "Loading profile..." : details?.name || entity?.name || "Entity Profile"}
            description={sectionDescription(entityType)}
            avatarInitials={avatarInitials}
            avatarColor={avatarColor}
            companyName={entityType === "employee" ? companyName : undefined}
            companyAvatarInitials={entityType === "employee" ? companyAvatarInitials : undefined}
            companyAvatarColor={entityType === "employee" ? companyAvatarColor : undefined}
            metrics={metrics}
            actions={actions}
          />

          <EntityProfileTabs entityType={entityType} id={id} activeSection="overview" />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
            <div className="space-y-6">
              <SectionCard
                title={entityType === "company" ? "Company Details" : "Profile Details"}
                description="Core identity and contact details presented like a profile."
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <ProfileField label="Name" value={details?.name} />
                  <ProfileField label="Email" value={details?.email} />
                  <ProfileField label="Phone 1" value={details?.phone1} />
                  <ProfileField label="Phone 2" value={details?.phone2} />

                  {entityType === "company" && (
                    <>
                      <ProfileField label="License No" value={details?.licenseNo} />
                      <ProfileField label="Company Type" value={details?.companyType} />
                      <ProfileField label="Emirates" value={details?.emirates} />
                      <ProfileField label="Transaction No" value={details?.transactionNo} />
                      <ProfileField label="Mainland" value={details?.isMainland} />
                    </>
                  )}

                  {entityType === "employee" && (
                    <>
                      <ProfileField label="Company" value={details?.company?.name} />
                      <ProfileField label="Emirates ID" value={details?.emiratesId} />
                      <ProfileField label="Nationality" value={details?.nationality} />
                      <ProfileField label="Designation" value={details?.designation} />
                    </>
                  )}

                  {entityType === "individual" && (
                    <>
                      <ProfileField label="Emirates ID" value={details?.emiratesId} />
                      <ProfileField label="Nationality" value={details?.nationality} />
                      <ProfileField label="Designation" value={details?.designation} />
                    </>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Documents"
                description="Recent attached documents and expiry snapshots."
              >
                <div className="space-y-3">
                  {documents.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No documents found.</p>
                  ) : (
                    documents.map((doc) => (
                      <div
                        key={doc._id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/30"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {doc.name || "Untitled document"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Expiry: {formatDate(doc.expiryDate)}
                          </p>
                        </div>
                        {hasValue(doc.notes) && (
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            {doc.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Credentials"
                description="Access and platform entries connected to this profile."
              >
                <div className="space-y-3">
                  {credentials.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No credentials found.</p>
                  ) : (
                    credentials.map((item) => (
                      <div
                        key={item._id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/30"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {item.platform || "Unknown platform"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Username: {item.username || "-"}
                          </p>
                        </div>
                        {hasValue(item.notes) && (
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Handovers"
                description="Physical handover activity linked to this profile."
              >
                <HandoverList
                  entityId={id}
                  entityName={details?.name || entity?.name || "Entity"}
                  entityType={entityType}
                />
              </SectionCard>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-6 self-start">
              <SectionCard title="Profile Snapshot" description="Quick facts at a glance.">
                <div className="space-y-3">
                  <ProfileField label="Profile Type" value={entityType} />
                  <ProfileField label="Name" value={details?.name || entity?.name} />
                  <ProfileField label="Email" value={details?.email} />
                  <ProfileField label="Primary Phone" value={details?.phone1 || details?.phone2} />
                  {entityType === "employee" && (
                    <ProfileField label="Company" value={companyName} />
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Status" description="Current state and related indicators.">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Status
                    </p>
                    <p className="mt-1 inline-flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
                      <FiCheckCircle />
                      Active
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Entity Type
                    </p>
                    <p className="mt-1 inline-flex items-center gap-2 font-semibold capitalize text-slate-900 dark:text-slate-100">
                      <FiTag className="text-slate-400" />
                      {entityType}
                    </p>
                  </div>
                  {hasValue(details?.phone1 || details?.phone2) && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        Primary Contact
                      </p>
                      <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                        <FiPhone className="text-slate-400" />
                        {details?.phone1 || details?.phone2}
                      </p>
                    </div>
                  )}
                  {entityType === "company" && hasValue(details?.emirates) && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        Region
                      </p>
                      <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                        <FiGlobe className="text-slate-400" />
                        {details?.emirates}
                      </p>
                    </div>
                  )}
                </div>
              </SectionCard>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">
                <MetricCard icon={<FiFolder />} label="Documents" value={counts?.documents || 0} />
                <MetricCard icon={<FiFileText />} label="Handovers" value={counts?.handovers || 0} />
                <MetricCard icon={<FiLayers />} label="Credentials" value={counts?.credentials || 0} />
                {entityType === "company" && (
                  <MetricCard icon={<FiUsers />} label="Employees" value={counts?.employees || 0} />
                )}
                <MetricCard icon={<FiCreditCard />} label="Invoices" value={counts?.invoices || 0} />
              </div>
            </aside>
          </div>
      </div>
      )}
    </>
  );
}
