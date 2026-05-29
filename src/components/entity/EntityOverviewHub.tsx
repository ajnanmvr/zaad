"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import {
  FiCheckCircle,
  FiCreditCard,
  FiEdit2,
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
  FiTrash2,
  FiTag,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import HandoverList from "../HandoverList";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import {
  EntityProfileHeader,
  EntityProfileSkeleton,
  EntityProfileTabs,
  EntityType,
  MetricCard,
  ProfileField,
  SectionCard,
  formatDate,
  hasValue,
  initialsFromName,
  resolveAvatarColorWithFallback,
} from "./EntityProfileFrame";
import calculateStatus from "@/utils/calculateStatus";
import { getDocumentCategoryLabel } from "@/config/documentCategoryVisuals";

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
      documentTemplate?: string;
      name?: string;
      templateCategory?: "visa" | "license" | "other";
      issueDate?: string;
      expiryDate?: string;
      notes?: string;
      archived?: boolean;
      archiveNotes?: string;
      archivedAt?: string;
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
  const router = useRouter();
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
  const [showDeleteEntityConfirm, setShowDeleteEntityConfirm] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingCredentialId, setEditingCredentialId] = useState<string | null>(null);
  const [deleteDocumentConfirmId, setDeleteDocumentConfirmId] = useState<string | null>(null);
  const [deleteCredentialConfirmId, setDeleteCredentialConfirmId] = useState<string | null>(null);
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

  const { data: detailRes, isLoading: detailLoading, refetch: refetchDetails } =
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

  const { data: documentTemplateRes } = useQuery<{ options: TemplateOption[] }>({
    queryKey: ["document-template-options"],
    queryFn: async () => {
      const { data } = await axios.get("/api/templates", { params: { type: "document" } });
      return data;
    },
  });

  const { data: credentialTemplateRes } = useQuery<{ options: TemplateOption[] }>({
    queryKey: ["credential-template-options"],
    queryFn: async () => {
      const { data } = await axios.get("/api/templates", { params: { type: "credential" } });
      return data;
    },
  });

  const entity = overviewRes?.data.entity;
  const counts = overviewRes?.data.counts;
  const details = detailRes?.data;
  const documents = useMemo(() => detailRes?.data?.documents || [], [detailRes?.data?.documents]);
  const credentials = useMemo(() => detailRes?.data?.credentials || [], [detailRes?.data?.credentials]);
  const documentOptions = documentTemplateRes?.options || [];
  const credentialOptions = credentialTemplateRes?.options || [];
  const isLoading = !overviewRes || !detailRes;

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

  const startRenew = (doc: NonNullable<EntityDetailsResponse["data"]["documents"]>[number]) => {
    setRenewingDocId(doc._id);
    setRenewExpiryDate(doc.expiryDate ? doc.expiryDate.slice(0, 10) : "");
  };

  const submitRenew = async (doc: NonNullable<EntityDetailsResponse["data"]["documents"]>[number]) => {
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
      await refetchDetails();
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

    const nextDocuments = [
      ...documents.map((item) => ({
        documentTemplate: item.documentTemplate,
        issueDate: item.issueDate,
        expiryDate: item.expiryDate,
        notes: item.notes,
        archived: item.archived,
        archiveNotes: item.archiveNotes,
      })),
      {
        documentTemplate: documentDraft.documentTemplate,
        issueDate: documentDraft.issueDate || undefined,
        expiryDate: documentDraft.expiryDate,
        notes: documentDraft.notes || undefined,
      },
    ];

    try {
      setIsAddingDocument(true);
      if (editingDocumentId) {
        await axios.put(`/api/${entityType}/${id}/doc/${editingDocumentId}`, {
          documentTemplate: documentDraft.documentTemplate,
          issueDate: documentDraft.issueDate || undefined,
          expiryDate: documentDraft.expiryDate,
          notes: documentDraft.notes || undefined,
        });
        toast.success("Document updated successfully");
      } else {
        await axios.put(`/api/${entityType}/${id}`, { documents: nextDocuments });
        toast.success("Document added successfully");
      }
      setShowAddDocument(false);
      setEditingDocumentId(null);
      setDocumentDraft({
        documentTemplate: "",
        issueDate: "",
        expiryDate: "",
        notes: "",
      });
      await refetchDetails();
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
      if (editingCredentialId) {
        await axios.put(`/api/${entityType}/${id}/credential/${editingCredentialId}`, {
          credentialTemplate: credentialDraft.credentialTemplate,
          username: credentialDraft.username,
          notes: credentialDraft.notes || undefined,
          password: credentialDraft.password,
        });
        toast.success("Credential updated successfully");
      } else {
        await axios.put(`/api/${entityType}/${id}`, { credentials: nextCredentials });
        toast.success("Credential added successfully");
      }
      setShowAddCredential(false);
      setEditingCredentialId(null);
      setCredentialDraft({
        credentialTemplate: "",
        username: "",
        password: "",
        notes: "",
      });
      await refetchDetails();
    } catch (error) {
      toast.error("Failed to add credential");
      console.error(error);
    } finally {
      setIsAddingCredential(false);
    }
  };

  const startEditDocument = (doc: NonNullable<EntityDetailsResponse["data"]["documents"]>[number]) => {
    setEditingDocumentId(doc._id);
    setDocumentDraft({
      documentTemplate: doc.documentTemplate || "",
      issueDate: doc.issueDate || "",
      expiryDate: doc.expiryDate || "",
      notes: doc.notes || "",
    });
    setShowAddDocument(true);
  };

  const startEditCredential = (item: NonNullable<EntityDetailsResponse["data"]["credentials"]>[number]) => {
    setEditingCredentialId(item._id);
    setCredentialDraft({
      credentialTemplate: item.credentialTemplate || "",
      username: item.username || "",
      password: item.credential || item.password || "",
      notes: item.notes || "",
    });
    setShowAddCredential(true);
  };

  const deleteDocument = async (docId: string) => {
    if (deleteDocumentConfirmId !== docId) {
      setDeleteDocumentConfirmId(docId);
      toast.error("Click delete again to confirm");
      return;
    }

    try {
      await axios.delete(`/api/${entityType}/${id}/doc/${docId}`);
      toast.success("Document deleted successfully");
      setDeleteDocumentConfirmId(null);
      await refetchDetails();
    } catch (error) {
      toast.error("Failed to delete document");
      console.error(error);
    }
  };

  const deleteCredential = async (credentialId: string) => {
    if (deleteCredentialConfirmId !== credentialId) {
      setDeleteCredentialConfirmId(credentialId);
      toast.error("Click delete again to confirm");
      return;
    }

    try {
      await axios.delete(`/api/${entityType}/${id}/credential/${credentialId}`);
      toast.success("Credential deleted successfully");
      setDeleteCredentialConfirmId(null);
      await refetchDetails();
    } catch (error) {
      toast.error("Failed to delete credential");
      console.error(error);
    }
  };

  const avatarInitials = initialsFromName(entity?.name || details?.name);
  const avatarColor = resolveAvatarColorWithFallback(entity?.color || details?.color, entity?.name || details?.name);
  const companyName = entity?.company?.name || details?.company?.name;
  const companyId = (entity?.company as any)?._id || (entity?.company as any)?.id || (details?.company as any)?._id || (details?.company as any)?.id;
  const companyHref = entityType === "employee" && companyId ? `/company/${companyId}` : undefined;
  const companyAvatarInitials = initialsFromName(companyName);
  const companyAvatarColor = resolveAvatarColorWithFallback(
    entity?.company?.color || details?.company?.color,
    companyName,
  );

  const performDeleteEntity = async () => {
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

  const handleDeleteEntity = async () => {
    setShowDeleteEntityConfirm(true);
  };

  return (
    <>
      <Breadcrumb pageName={entity ? entity.name : `${entityType} profile`} />

      <ConfirmationModal
        isOpen={showDeleteEntityConfirm}
        title="Delete Entity"
        message={`Delete this ${entityType}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeletingEntity}
        onCancel={() => {
          if (!isDeletingEntity) {
            setShowDeleteEntityConfirm(false);
          }
        }}
        onConfirm={() => {
          setShowDeleteEntityConfirm(false);
          void performDeleteEntity();
        }}
      />

      {isLoading ? (
        <EntityProfileSkeleton entityType={entityType} />
      ) : (
        <div className="space-y-6">
          <EntityProfileHeader
            entityType={entityType}
            name={detailLoading ? "Loading profile..." : details?.name || entity?.name || "Entity Profile"}
            avatarInitials={avatarInitials}
            avatarColor={avatarColor}
            companyName={entityType === "employee" ? companyName : undefined}
            companyAvatarInitials={entityType === "employee" ? companyAvatarInitials : undefined}
            companyAvatarColor={entityType === "employee" ? companyAvatarColor : undefined}
            companyHref={entityType === "employee" ? companyHref : undefined}
            onEditHref={`/${entityType}/${id}/edit`}
            onDelete={handleDeleteEntity}
            isDeleting={isDeletingEntity}
          />

          <EntityProfileTabs
            entityType={entityType}
            id={id}
            activeSection="overview"
            sectionCounts={{
              details: counts?.details || 0,
              documents: counts?.documents || 0,
              credentials: counts?.credentials || 0,
              handovers: counts?.handovers || 0,
              employees: counts?.employees || 0,
              records: counts?.records || 0,
              invoices: counts?.invoices || 0,
            }}
          />

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
                      onClick={() => {
                        setShowAddDocument((prev) => {
                          const next = !prev;
                          if (!next) {
                            setEditingDocumentId(null);
                            setDocumentDraft({ documentTemplate: "", issueDate: "", expiryDate: "", notes: "" });
                          }
                          return next;
                        });
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700/50 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                    >
                      <FiPlus />
                      {showAddDocument ? "Cancel" : editingDocumentId ? "Edit Document" : "Add Document"}
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
                        const isArchived = Boolean(doc.archived);
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
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                                  {getDocumentCategoryLabel(doc.templateCategory)}
                                </span>
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-300">Issue: {formatDate(doc.issueDate)}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-300">Expiry: {formatDate(doc.expiryDate)}</p>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span
                                className={clsx(
                                  "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                                  isArchived
                                    ? "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300"
                                    : status === "valid"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                    : status === "expired"
                                      ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                                      : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
                                )}
                              >
                                {isArchived ? "archived" : status}
                              </span>
                              {!isArchived && (
                                <button
                                  type="button"
                                  onClick={() => startRenew(doc)}
                                  className="rounded-md border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                                >
                                  Renew
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => startEditDocument(doc)}
                                className="inline-flex items-center gap-1 rounded-md border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-500/10"
                              >
                                <FiEdit2 />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteDocument(doc._id)}
                                className={clsx(
                                  "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold transition",
                                  deleteDocumentConfirmId === doc._id
                                    ? "border-rose-400 bg-rose-100 text-rose-700 dark:border-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
                                    : "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/10",
                                )}
                              >
                                <FiTrash2 />
                                Delete
                              </button>
                            </div>
                            {hasValue(doc.notes) && (
                              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{doc.notes}</p>
                            )}
                            {hasValue(doc.archiveNotes) && (
                              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                Archive reason: {doc.archiveNotes}
                              </p>
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
              </SectionCard>

              <SectionCard
                title="Credentials"
                description="Access and platform entries connected to this profile."
              >
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
                      onClick={() => {
                        setShowAddCredential((prev) => {
                          const next = !prev;
                          if (!next) {
                            setEditingCredentialId(null);
                            setCredentialDraft({ credentialTemplate: "", username: "", password: "", notes: "" });
                          }
                          return next;
                        });
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-700/50 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                    >
                      <FiPlus />
                      {showAddCredential ? "Cancel" : editingCredentialId ? "Edit Credential" : "Add Credential"}
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
                              <button
                                type="button"
                                onClick={() => startEditCredential(item)}
                                className="inline-flex items-center gap-1 rounded-md border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-500/10"
                                title="Edit credential"
                              >
                                <FiEdit2 />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteCredential(item._id)}
                                className={clsx(
                                  "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold transition",
                                  deleteCredentialConfirmId === item._id
                                    ? "border-rose-400 bg-rose-100 text-rose-700 dark:border-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
                                    : "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/10",
                                )}
                                title="Delete credential"
                              >
                                <FiTrash2 />
                                Delete
                              </button>
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
              </SectionCard>

              <SectionCard
                title="Handovers"
                description="Physical handover activity linked to this profile."
              >
                <HandoverList
                  entityId={id}
                  entityName={details?.name || entity?.name || "Entity"}
                  entityType={entityType}
                  compact
                />
              </SectionCard>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-6 self-start">
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
