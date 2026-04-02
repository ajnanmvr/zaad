"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import {
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiEye,
  FiEyeOff,
  FiFileText,
  FiFolder,
  FiGlobe,
  FiLayers,
  FiLock,
  FiMessageSquare,
  FiPhone,
  FiPlus,
  FiTag,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import calculateStatus from "@/utils/calculateStatus";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import HandoverList from "../HandoverList";
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
      documentTemplate?: string;
      name?: string;
      issueDate?: string;
      expiryDate?: string;
      notes?: string;
    }>;
    credentials?: Array<{
      _id: string;
      credentialTemplate?: string;
      platform?: string;
      username?: string;
      notes?: string;
      credential?: string;
      password?: string;
    }>;
  };
};

type TemplateOption = {
  id: string;
  name?: string;
  platform?: string;
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
  const router = useRouter();
  const sectionTitle = getSectionTitle(section);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [isAddingCredential, setIsAddingCredential] = useState(false);
  const [visibleCredentialIds, setVisibleCredentialIds] = useState<string[]>([]);
  const [documentSort, setDocumentSort] = useState<"expiry-asc" | "expiry-desc" | "name-asc">("expiry-asc");
  const [credentialSort, setCredentialSort] = useState<"platform-asc" | "platform-desc" | "username-asc">("platform-asc");
  const [renewingDocId, setRenewingDocId] = useState<string | null>(null);
  const [renewExpiryDate, setRenewExpiryDate] = useState("");
  const [isRenewingDoc, setIsRenewingDoc] = useState(false);
  const [isDeletingEntity, setIsDeletingEntity] = useState(false);
  const [documentDraft, setDocumentDraft] = useState({
    documentTemplate: "",
    issueDate: "",
    expiryDate: "",
    notes: "",
  });
  const [credentialDraft, setCredentialDraft] = useState({
    credentialTemplate: "",
    username: "",
    password: "",
    notes: "",
  });

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

  const { data: documentTemplateRes } = useQuery<{ options: TemplateOption[] }>({
    queryKey: ["document-template-options"],
    queryFn: async () => {
      const { data } = await axios.get("/api/templates", { params: { type: "document" } });
      return data;
    },
    enabled: section === "documents",
  });

  const { data: credentialTemplateRes } = useQuery<{ options: TemplateOption[] }>({
    queryKey: ["credential-template-options"],
    queryFn: async () => {
      const { data } = await axios.get("/api/templates", { params: { type: "credential" } });
      return data;
    },
    enabled: section === "credentials",
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
  const documentOptions = documentTemplateRes?.options || [];
  const credentialOptions = credentialTemplateRes?.options || [];

  const sortedDocuments = useMemo(() => {
    const clone = [...documents];
    if (documentSort === "name-asc") {
      return clone.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    if (documentSort === "expiry-desc") {
      return clone.sort(
        (a, b) =>
          new Date(b.expiryDate || "1970-01-01").getTime() -
          new Date(a.expiryDate || "1970-01-01").getTime(),
      );
    }
    return clone.sort(
      (a, b) =>
        new Date(a.expiryDate || "1970-01-01").getTime() -
        new Date(b.expiryDate || "1970-01-01").getTime(),
    );
  }, [documents, documentSort]);

  const sortedCredentials = useMemo(() => {
    const clone = [...credentials];
    if (credentialSort === "platform-desc") {
      return clone.sort((a, b) => (b.platform || "").localeCompare(a.platform || ""));
    }
    if (credentialSort === "username-asc") {
      return clone.sort((a, b) => (a.username || "").localeCompare(b.username || ""));
    }
    return clone.sort((a, b) => (a.platform || "").localeCompare(b.platform || ""));
  }, [credentials, credentialSort]);

  const startRenew = (doc: NonNullable<EntityDetailResponse["data"]["documents"]>[number]) => {
    setRenewingDocId(doc._id);
    setRenewExpiryDate(doc.expiryDate ? doc.expiryDate.slice(0, 10) : "");
  };

  const submitRenew = async (doc: NonNullable<EntityDetailResponse["data"]["documents"]>[number]) => {
    if (!renewExpiryDate) {
      toast.error("Please choose a new expiry date");
      return;
    }

    try {
      setIsRenewingDoc(true);
      await axios.put(`/api/${entityType}/${id}/doc/${doc._id}`, {
        documentTemplate: doc.documentTemplate,
        issueDate: doc.issueDate,
        expiryDate: renewExpiryDate,
        notes: doc.notes,
      });
      toast.success("Document renewed");
      setRenewingDocId(null);
      setRenewExpiryDate("");
      await refetchEntity();
    } catch (error) {
      toast.error("Failed to renew document");
      console.error(error);
    } finally {
      setIsRenewingDoc(false);
    }
  };

  const handleAddDocument = async () => {
    if (!documentDraft.documentTemplate) {
      toast.error("Please select a document option");
      return;
    }
    if (!documentDraft.expiryDate) {
      toast.error("Please choose an expiry date");
      return;
    }

    const selectedTemplate = documentOptions.find((item) => item.id === documentDraft.documentTemplate);
    const nextDocuments = [
      ...documents.map((item) => ({
        documentTemplate: item.documentTemplate,
        issueDate: item.issueDate,
        expiryDate: item.expiryDate,
        notes: item.notes,
      })),
      {
        documentTemplate: documentDraft.documentTemplate,
        issueDate: documentDraft.issueDate || undefined,
        expiryDate: documentDraft.expiryDate,
        notes: documentDraft.notes || undefined,
        name: selectedTemplate?.name,
      },
    ];

    try {
      setIsAddingDocument(true);
      await axios.put(`/api/${entityType}/${id}`, { documents: nextDocuments });
      toast.success("Document added successfully");
      setShowAddDocument(false);
      setDocumentDraft({
        documentTemplate: "",
        issueDate: "",
        expiryDate: "",
        notes: "",
      });
      await refetchEntity();
    } catch (error) {
      toast.error("Failed to add document");
      console.error(error);
    } finally {
      setIsAddingDocument(false);
    }
  };

  const handleAddCredential = async () => {
    if (!credentialDraft.credentialTemplate) {
      toast.error("Please select a credential option");
      return;
    }
    if (!credentialDraft.username.trim()) {
      toast.error("Username is required");
      return;
    }

    const nextCredentials = [
      ...credentials.map((item) => ({
        credentialTemplate: item.credentialTemplate,
        username: item.username,
        notes: item.notes,
        credential: item.credential || item.password || "",
      })),
      {
        credentialTemplate: credentialDraft.credentialTemplate,
        username: credentialDraft.username,
        notes: credentialDraft.notes || undefined,
        credential: credentialDraft.password,
      },
    ];

    try {
      setIsAddingCredential(true);
      await axios.put(`/api/${entityType}/${id}`, { credentials: nextCredentials });
      toast.success("Credential added successfully");
      setShowAddCredential(false);
      setCredentialDraft({
        credentialTemplate: "",
        username: "",
        password: "",
        notes: "",
      });
      await refetchEntity();
    } catch (error) {
      toast.error("Failed to add credential");
      console.error(error);
    } finally {
      setIsAddingCredential(false);
    }
  };

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

  const handleDeleteEntity = async () => {
    if (!confirm(`Delete this ${entityType}?`)) {
      return;
    }

    try {
      setIsDeletingEntity(true);
      await axios.delete(`/api/${entityType}/${id}`);
      toast.success(`${entityType} deleted successfully`);
      router.push(`/${entityType}`);
    } catch (error) {
      toast.error(`Failed to delete ${entityType}`);
      console.error(error);
    } finally {
      setIsDeletingEntity(false);
    }
  };

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

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push(`/${entityType}/${id}/edit`)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Edit {entityType}
          </button>
          <button
            type="button"
            onClick={handleDeleteEntity}
            disabled={isDeletingEntity}
            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
          >
            {isDeletingEntity ? "Deleting..." : `Delete ${entityType}`}
          </button>
        </div>

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
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <select
                    value={documentSort}
                    onChange={(event) => setDocumentSort(event.target.value as "expiry-asc" | "expiry-desc" | "name-asc")}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="expiry-asc">Sort: Expiry nearest</option>
                    <option value="expiry-desc">Sort: Expiry latest</option>
                    <option value="name-asc">Sort: Name A-Z</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddDocument((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700/50 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                  >
                    <FiPlus />
                    {showAddDocument ? "Cancel" : "Add Document"}
                  </button>
                </div>

                {showAddDocument && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Document</label>
                        <select
                          value={documentDraft.documentTemplate}
                          onChange={(event) => setDocumentDraft((prev) => ({ ...prev, documentTemplate: event.target.value }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        >
                          <option value="">Select document</option>
                          {documentOptions.map((option) => (
                            <option key={option.id} value={option.id}>{option.name || "Unnamed document"}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Issue Date</label>
                        <input
                          type="date"
                          value={documentDraft.issueDate}
                          onChange={(event) => setDocumentDraft((prev) => ({ ...prev, issueDate: event.target.value }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Expiry Date</label>
                        <input
                          type="date"
                          value={documentDraft.expiryDate}
                          onChange={(event) => setDocumentDraft((prev) => ({ ...prev, expiryDate: event.target.value }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</label>
                        <textarea
                          rows={3}
                          value={documentDraft.notes}
                          onChange={(event) => setDocumentDraft((prev) => ({ ...prev, notes: event.target.value }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddDocument}
                        disabled={isAddingDocument}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isAddingDocument ? "Saving..." : "Save Document"}
                      </button>
                    </div>
                  </div>
                )}

                {documents.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No documents found.</p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-800/20">
                    {sortedDocuments.map((doc, index) => {
                      const status = calculateStatus(doc.expiryDate || "");
                      return (
                        <div
                          key={doc._id}
                          className={clsx(
                            "p-4",
                            index !== sortedDocuments.length - 1 && "border-b border-slate-200 dark:border-slate-700",
                          )}
                        >
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                              <FiFileText className="text-slate-400" />
                              {doc.name || "Untitled document"}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Issue: {formatDate(doc.issueDate)}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Expiry: {formatDate(doc.expiryDate)}</p>
                            <div className="flex items-center gap-2">
                              <span
                                className={clsx(
                                  "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                                  status === "valid"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                    : status === "expired"
                                      ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                                      : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
                                )}
                              >
                                {status}
                              </span>
                              <button
                                type="button"
                                onClick={() => startRenew(doc)}
                                className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                              >
                                Renew
                              </button>
                            </div>
                          </div>
                          {hasValue(doc.notes) && (
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{doc.notes}</p>
                          )}
                          {renewingDocId === doc._id && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <input
                                type="date"
                                value={renewExpiryDate}
                                onChange={(event) => setRenewExpiryDate(event.target.value)}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                              />
                              <button
                                type="button"
                                onClick={() => submitRenew(doc)}
                                disabled={isRenewingDoc}
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                              >
                                {isRenewingDoc ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRenewingDocId(null)}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {section === "credentials" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <select
                    value={credentialSort}
                    onChange={(event) => setCredentialSort(event.target.value as "platform-asc" | "platform-desc" | "username-asc")}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="platform-asc">Sort: Platform A-Z</option>
                    <option value="platform-desc">Sort: Platform Z-A</option>
                    <option value="username-asc">Sort: Username A-Z</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddCredential((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-700/50 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                  >
                    <FiPlus />
                    {showAddCredential ? "Cancel" : "Add Credential"}
                  </button>
                </div>

                {showAddCredential && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Platform</label>
                        <select
                          value={credentialDraft.credentialTemplate}
                          onChange={(event) => setCredentialDraft((prev) => ({ ...prev, credentialTemplate: event.target.value }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        >
                          <option value="">Select platform</option>
                          {credentialOptions.map((option) => (
                            <option key={option.id} value={option.id}>{option.platform || "Unnamed platform"}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Username</label>
                        <input
                          type="text"
                          value={credentialDraft.username}
                          onChange={(event) => setCredentialDraft((prev) => ({ ...prev, username: event.target.value }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
                        <input
                          type="text"
                          value={credentialDraft.password}
                          onChange={(event) => setCredentialDraft((prev) => ({ ...prev, password: event.target.value }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</label>
                        <textarea
                          rows={3}
                          value={credentialDraft.notes}
                          onChange={(event) => setCredentialDraft((prev) => ({ ...prev, notes: event.target.value }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddCredential}
                        disabled={isAddingCredential}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isAddingCredential ? "Saving..." : "Save Credential"}
                      </button>
                    </div>
                  </div>
                )}

                {credentials.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No credentials found.</p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-800/20">
                    {sortedCredentials.map((item, index) => {
                      const isVisible = visibleCredentialIds.includes(item._id);
                      const plainSecret = item.credential || item.password || "";

                      return (
                        <div
                          key={item._id}
                          className={clsx(
                            "p-4",
                            index !== sortedCredentials.length - 1 && "border-b border-slate-200 dark:border-slate-700",
                          )}
                        >
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                              <FiLayers className="text-slate-400" />
                              Platform: {item.platform || "Unknown platform"}
                            </p>
                            <p className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <FiUser className="text-slate-400" />
                              Username: {item.username || "-"}
                            </p>
                            <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 sm:col-span-2">
                              <FiLock className="text-slate-400" />
                              <span>Password: {plainSecret ? (isVisible ? plainSecret : "******") : "-"}</span>
                              {plainSecret && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVisibleCredentialIds((prev) =>
                                      prev.includes(item._id)
                                        ? prev.filter((id) => id !== item._id)
                                        : [...prev, item._id],
                                    );
                                  }}
                                  className="rounded-md border border-slate-300 p-1 text-slate-500 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                                  title={isVisible ? "Hide password" : "Show password"}
                                >
                                  {isVisible ? <FiEyeOff /> : <FiEye />}
                                </button>
                              )}
                            </div>
                          </div>
                          {hasValue(item.notes) && (
                            <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <FiMessageSquare className="text-slate-400" />
                              {item.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {section === "handovers" && (
              <HandoverList entityId={id} entityName={entityName} entityType={entityType} compact />
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
