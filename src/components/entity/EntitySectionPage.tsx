"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  FiCalendar,
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
import EmployeeList from "@/components/Tables/EmployeeList";
import { TEntityListItem, TPagination } from "@/types/types";

import {
  EntityProfileHeader,
  EntitySectionSkeleton,
  EntityProfileTabs,
  EntitySectionKey,
  EntityType,
  EntityMetric,
  MetricCard,
  ProfileField,
  SectionCard,
  formatDate,
  getSectionTitle,
  hasValue,
  initialsFromName,
  resolveAvatarColorWithFallback,
} from "./EntityProfileFrame";
import DocumentManagementCard from "./DocumentManagementCard";

type EntityDetailResponse = {
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

type Section = EntitySectionKey;

function sectionDescription(section: Section) {
  switch (section) {
    case "details":
      return "Profile details presented with a focus on contact and identity fields.";
    case "documents":
      return "Document cards with expiry dates and attached notes.";
    case "credentials":
      return "Platform credentials and usernames connected to this profile.";
    case "handovers":
      return "Physical handover history tied to the selected profile.";
    case "employees":
      return "Employees tied to the company profile.";
    case "records":
      return "Account records and payment activity linked to this profile.";
    case "invoices":
      return "Invoices associated with this profile.";
    default:
      return "";
  }
}

export default function EntitySectionPage({
  entityType,
  id,
  section,
}: {
  entityType: EntityType;
  id: string;
  section: Section;
}) {
  const sectionTitle = getSectionTitle(section);

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

  const { data: entityRes, refetch: refetchEntity } = useQuery<EntityDetailResponse>({
    queryKey: ["entity-section-base", entityType, id],
    queryFn: async () => {
      const res = await fetch(`/api/${entityType}/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch entity");
      }
      return res.json();
    },
    enabled: section === "details" || section === "documents" || section === "credentials" || section === "handovers" || section === "invoices",
  });

  const { data: recordsRes } = useQuery<any>({
    queryKey: ["entity-records", entityType, id],
    queryFn: async () => {
      const endpoint = entityType === "individual" ? "/api/payment/self" : `/api/payment/${entityType}/${id}`;
      const { data } = await axios.get(endpoint);
      return data;
    },
    enabled: section === "records",
  });

  const { data: invoicesRes } = useQuery<any>({
    queryKey: ["entity-invoices", entityType, id, entityRes?.data?.name],
    queryFn: async () => {
      const name = entityRes?.data?.name || "";
      const { data } = await axios.get(`/api/invoice?page=0&search=${encodeURIComponent(name)}`);
      return data;
    },
    enabled: section === "invoices" && Boolean(entityRes?.data?.name),
  });

  const { data: employeesByCompanyRes } = useQuery<{ data: TEntityListItem[]; pagination: TPagination }>({
    queryKey: ["company-employees", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/employee/company/${id}?page=1&limit=100`);
      return data;
    },
    enabled: section === "employees" && entityType === "company",
  });

  const entity = overviewRes?.data.entity;
  const counts = overviewRes?.data.counts;
  const details = entityRes?.data;
  const documents = entityRes?.data?.documents || [];
  const credentials = entityRes?.data?.credentials || [];
  const entityName = entityRes?.data?.name || entity?.name || "Entity";
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
      value: counts?.documents || documents.length || 0,
    },
    {
      icon: <FiFileText />,
      label: "Handovers",
      value: counts?.handovers || 0,
    },
    {
      icon: <FiLayers />,
      label: "Credentials",
      value: counts?.credentials || credentials.length || 0,
    },
  ];

  if (entityType === "company") {
    metrics.push({
      icon: <FiUsers />,
      label: "Employees",
      value: counts?.employees || employeesByCompanyRes?.data?.length || 0,
    });
  } else {
    metrics.push({
      icon: <FiCreditCard />,
      label: "Invoices",
      value: counts?.invoices || invoicesRes?.invoices?.length || 0,
    });
  }

  const actions = [
    {
      href: `/${entityType}/${id}/edit`,
      label: "Edit profile",
      primary: true,
    },
  ];

  const needsEntityData = section === "details" || section === "documents" || section === "credentials" || section === "handovers" || section === "invoices";
  const needsRecordsData = section === "records";
  const needsEmployeesData = section === "employees" && entityType === "company";
  const needsInvoicesData = section === "invoices";
  const isLoading = !overviewRes || (needsEntityData && !entityRes) || (needsRecordsData && !recordsRes) || (needsEmployeesData && !employeesByCompanyRes) || (needsInvoicesData && !invoicesRes);

  if (isLoading) {
    return (
      <>
        <Breadcrumb pageName={`${entityName} / ${sectionTitle}`} />
        <EntitySectionSkeleton entityType={entityType} sectionTitle={sectionTitle} />
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName={`${entityName} / ${sectionTitle}`} />

      <div className="space-y-6">
        <EntityProfileHeader
          entityType={entityType}
          name={entityName}
          description={sectionDescription(section)}
          avatarInitials={avatarInitials}
          avatarColor={avatarColor}
          companyName={entityType === "employee" ? companyName : undefined}
          companyAvatarInitials={entityType === "employee" ? companyAvatarInitials : undefined}
          companyAvatarColor={entityType === "employee" ? companyAvatarColor : undefined}
          metrics={metrics}
          actions={actions}
        />

        <EntityProfileTabs entityType={entityType} id={id} activeSection={section} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
          <SectionCard title={sectionTitle} description={sectionDescription(section)}>
            {section === "details" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ProfileField label="Name" value={entityRes?.data?.name} />
                <ProfileField label="Email" value={entityRes?.data?.email} />
                <ProfileField label="Phone" value={entityRes?.data?.phone1} />
                <ProfileField label="Phone 2" value={entityRes?.data?.phone2} />

                {entityType === "company" && (
                  <>
                    <ProfileField label="License No" value={entityRes?.data?.licenseNo} />
                    <ProfileField label="Company Type" value={entityRes?.data?.companyType} />
                    <ProfileField label="Emirates" value={entityRes?.data?.emirates} />
                    <ProfileField label="Transaction No" value={entityRes?.data?.transactionNo} />
                    <ProfileField label="Mainland" value={entityRes?.data?.isMainland} />
                  </>
                )}

                {entityType === "employee" && (
                  <>
                    <ProfileField label="Company" value={entityRes?.data?.company?.name} />
                    <ProfileField label="Emirates ID" value={entityRes?.data?.emiratesId} />
                    <ProfileField label="Nationality" value={entityRes?.data?.nationality} />
                    <ProfileField label="Designation" value={entityRes?.data?.designation} />
                  </>
                )}

                {entityType === "individual" && (
                  <>
                    <ProfileField label="Emirates ID" value={entityRes?.data?.emiratesId} />
                    <ProfileField label="Nationality" value={entityRes?.data?.nationality} />
                    <ProfileField label="Designation" value={entityRes?.data?.designation} />
                  </>
                )}
              </div>
            )}

            {section === "documents" && (
              <div className="space-y-3">
                {documents.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No documents found.</p>
                ) : (
                  documents.map((doc) => (
                    <DocumentManagementCard
                      key={doc._id}
                      document={doc}
                      entityType={entityType}
                      entityId={id}
                      onUpdate={refetchEntity}
                    />
                  ))
                )}
              </div>
            )}

            {section === "credentials" && (
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
            )}

            {section === "handovers" && (
              <HandoverList entityId={id} entityName={entityName} entityType={entityType} />
            )}

            {section === "employees" && entityType === "company" && (
              <EmployeeList employees={employeesByCompanyRes?.data} pagination={employeesByCompanyRes?.pagination} />
            )}

            {section === "records" && (
              <div className="space-y-3">
                {(recordsRes?.records || []).length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No records found.</p>
                ) : (
                  recordsRes.records.map((record: any) => (
                    <div
                      key={record.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/30"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {record.particular || "Transaction"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {record.type} · {record.amount} AED
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {record.date}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {section === "invoices" && (
              <div className="space-y-3">
                {(invoicesRes?.invoices || []).length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No invoices found.</p>
                ) : (
                  invoicesRes.invoices.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/30"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {invoice.invoiceNo}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {invoice.amount} AED
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {invoice.client} · {invoice.date}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </SectionCard>

          <aside className="space-y-6 xl:sticky xl:top-6 self-start">
            <SectionCard title="Profile Snapshot" description="Quick facts and context.">
              <div className="space-y-3">
                <ProfileField label="Profile Type" value={entityType} />
                <ProfileField label="Name" value={entityRes?.data?.name || entity?.name} />
                <ProfileField label="Email" value={entityRes?.data?.email} />
                <ProfileField label="Primary Phone" value={entityRes?.data?.phone1 || entityRes?.data?.phone2} />
                {entityType === "employee" && (
                  <ProfileField label="Company" value={companyName} />
                )}
                {entityType === "company" && <ProfileField label="Region" value={entityRes?.data?.emirates} />}
              </div>
            </SectionCard>

            <SectionCard title="Status" description="Current record state and related indicators.">
              <div className="space-y-3">
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
                    Section
                  </p>
                  <p className="mt-1 inline-flex items-center gap-2 font-semibold capitalize text-slate-900 dark:text-slate-100">
                    <FiTag className="text-slate-400" />
                    {sectionTitle}
                  </p>
                </div>
                {section === "documents" && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Latest expiry
                    </p>
                    <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                      <FiCalendar className="text-slate-400" />
                      {formatDate(documents[0]?.expiryDate)}
                    </p>
                  </div>
                )}
                {hasValue(entityRes?.data?.phone1 || entityRes?.data?.phone2) && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Primary Contact
                    </p>
                    <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                      <FiPhone className="text-slate-400" />
                      {entityRes?.data?.phone1 || entityRes?.data?.phone2}
                    </p>
                  </div>
                )}
                {entityType === "company" && hasValue(entityRes?.data?.emirates) && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Region
                    </p>
                    <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                      <FiGlobe className="text-slate-400" />
                      {entityRes?.data?.emirates}
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">
              <MetricCard icon={<FiFolder />} label="Documents" value={counts?.documents || documents.length || 0} />
              <MetricCard icon={<FiFileText />} label="Handovers" value={counts?.handovers || 0} />
              <MetricCard icon={<FiLayers />} label="Credentials" value={counts?.credentials || credentials.length || 0} />
              {entityType === "company" && (
                <MetricCard icon={<FiUsers />} label="Employees" value={counts?.employees || employeesByCompanyRes?.data?.length || 0} />
              )}
              <MetricCard icon={<FiCreditCard />} label="Invoices" value={counts?.invoices || invoicesRes?.invoices?.length || 0} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
