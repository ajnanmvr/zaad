"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import {
  FiCalendar,
  FiArchive,
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
  FiRefreshCw,
  FiTrash2,
  FiTag,
  FiUpload,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import calculateStatus from "@/utils/calculateStatus";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import HandoverList from "../HandoverList";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import EmployeeList from "@/components/Tables/EmployeeList";
import InvoiceList from "@/components/Tables/InvoiceList";
import TransactionList from "@/components/Tables/TransactionList";
import RelatedTasksPanel from "@/components/tasks/RelatedTasksPanel";
import { TEntityListItem, TPagination } from "@/types/types";
import ExportActionsMenu from "@/components/common/ExportActionsMenu";
import { exportRowsCsv, exportRowsExcel, exportRowsPdf } from "@/utils/exportTableData";
import {
  getDocumentCategoryIcon,
  getDocumentCategoryLabel,
  normalizeDocumentCategory,
} from "@/config/documentCategoryVisuals";

import {
  EntityProfileHeader,
  EntitySectionSkeleton,
  EntityProfileTabs,
  EntitySectionKey,
  EntityType,
  EntityMetric,
  MetricCard,
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
  color?: string;
  category?: "visa" | "license" | "other";
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
      tasks: number;
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
    case "tasks":
      return "Tasks linked to this profile for follow-up and delivery.";
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
  const [documentCategoryTab, setDocumentCategoryTab] = useState<
    "visa" | "license" | "other" | null
  >(null);
  const [visibleCredentialIds, setVisibleCredentialIds] = useState<string[]>(
    [],
  );
  const [documentSort, setDocumentSort] = useState<
    "expiry-asc" | "expiry-desc" | "name-asc"
  >("expiry-asc");
  const [credentialSort, setCredentialSort] = useState<
    "platform-asc" | "platform-desc" | "username-asc"
  >("platform-asc");
  const [renewingDocId, setRenewingDocId] = useState<string | null>(null);
  const [renewExpiryDate, setRenewExpiryDate] = useState("");
  const [isRenewingDoc, setIsRenewingDoc] = useState(false);
  const [isDeletingEntity, setIsDeletingEntity] = useState(false);
  const [showDeleteEntityConfirm, setShowDeleteEntityConfirm] = useState(false);
  const [showDeleteDocumentConfirm, setShowDeleteDocumentConfirm] = useState(false);
  const [showDeleteCredentialConfirm, setShowDeleteCredentialConfirm] = useState(false);
  const [showArchiveDocumentModal, setShowArchiveDocumentModal] = useState(false);
  const [isDeletingDocument, setIsDeletingDocument] = useState(false);
  const [isDeletingCredential, setIsDeletingCredential] = useState(false);
  const [isArchivingDocument, setIsArchivingDocument] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(
    null,
  );
  const [editingCredentialId, setEditingCredentialId] = useState<string | null>(
    null,
  );
  const [deleteDocumentConfirmId, setDeleteDocumentConfirmId] = useState<string | null>(null);
  const [deleteCredentialConfirmId, setDeleteCredentialConfirmId] = useState<string | null>(null);
  const [archiveDocumentId, setArchiveDocumentId] = useState<string | null>(null);
  const [archiveNoteDraft, setArchiveNoteDraft] = useState("");
  const [employeePage, setEmployeePage] = useState<number>(1);
  const [employeePageSize, setEmployeePageSize] = useState<number>(20);
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

  const { data: entityRes, refetch: refetchEntity } =
    useQuery<EntityDetailResponse>({
      queryKey: ["entity-section-base", entityType, id],
      queryFn: async () => {
        const res = await fetch(`/api/${entityType}/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch entity");
        }
        return res.json();
      },
      enabled:
        section === "details" ||
        section === "documents" ||
        section === "credentials" ||
        section === "handovers" ||
        section === "invoices",
    });

  const { data: employeesByCompanyRes } = useQuery<{
    data: TEntityListItem[];
    pagination: TPagination;
  }>({
    queryKey: ["company-employees", id, employeePage, employeePageSize],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/employee/company/${id}?page=${employeePage}&limit=${employeePageSize}`,
      );
      return data;
    },
    enabled: section === "employees" && entityType === "company",
  });

  const { data: documentTemplateRes } = useQuery<{ options: TemplateOption[] }>(
    {
      queryKey: ["document-template-options"],
      queryFn: async () => {
        const { data } = await axios.get("/api/templates", {
          params: { type: "document" },
        });
        return data;
      },
      enabled: section === "documents",
    },
  );

  const { data: credentialTemplateRes } = useQuery<{
    options: TemplateOption[];
  }>({
    queryKey: ["credential-template-options"],
    queryFn: async () => {
      const { data } = await axios.get("/api/templates", {
        params: { type: "credential" },
      });
      return data;
    },
    enabled: section === "credentials",
  });

  const entity = overviewRes?.data.entity;
  const counts = overviewRes?.data.counts;
  const details = entityRes?.data;
  const documents = useMemo(
    () => entityRes?.data?.documents || [],
    [entityRes?.data?.documents],
  );
  const credentials = useMemo(
    () => entityRes?.data?.credentials || [],
    [entityRes?.data?.credentials],
  );
  const entityName = entityRes?.data?.name || entity?.name || "Entity";
  const avatarInitials = initialsFromName(entity?.name || details?.name);
  const avatarColor = resolveAvatarColorWithFallback(
    entity?.color || details?.color,
    entity?.name || details?.name,
  );
  const companyName = entity?.company?.name || details?.company?.name;
  const companyAvatarInitials = initialsFromName(companyName);
  const companyAvatarColor = resolveAvatarColorWithFallback(
    entity?.company?.color || details?.company?.color,
    companyName,
  );
  const documentOptions = useMemo(
    () => documentTemplateRes?.options || [],
    [documentTemplateRes?.options],
  );
  const credentialOptions = useMemo(
    () => credentialTemplateRes?.options || [],
    [credentialTemplateRes?.options],
  );
  const documentTemplateMap = useMemo(
    () => new Map(documentOptions.map((item) => [item.id, item])),
    [documentOptions],
  );
  const credentialTemplateMap = useMemo(
    () => new Map(credentialOptions.map((item) => [item.id, item])),
    [credentialOptions],
  );
  const selectedDocumentTemplate = documentDraft.documentTemplate
    ? documentTemplateMap.get(documentDraft.documentTemplate)
    : undefined;
  const selectedDocumentTemplateCategory = normalizeDocumentCategory(
    selectedDocumentTemplate?.category,
  );
  const selectedDocumentTemplateIcon = getDocumentCategoryIcon(
    selectedDocumentTemplateCategory,
  );
  const SelectedDocumentTemplateIcon = selectedDocumentTemplateIcon;
  const selectedCredentialTemplate = credentialDraft.credentialTemplate
    ? credentialTemplateMap.get(credentialDraft.credentialTemplate)
    : undefined;
  const detailRows = useMemo(() => {
    const rows: Array<{ label: string; value: string | number | boolean }> = [];

    const addRow = (
      label: string,
      value: string | number | boolean | undefined,
    ) => {
      if (!hasValue(value)) return;
      rows.push({ label, value: value as string | number | boolean });
    };

    addRow("Name", details?.name);
    addRow("Email", details?.email);
    addRow("Phone", details?.phone1);
    addRow("Phone 2", details?.phone2);

    if (entityType === "company") {
      addRow("License No", details?.licenseNo);
      addRow("Company Type", details?.companyType);
      addRow("Emirates", details?.emirates);
      addRow("Transaction No", details?.transactionNo);
      addRow("Mainland", details?.isMainland);
    }

    if (entityType === "employee") {
      addRow("Company", details?.company?.name);
      addRow("Emirates ID", details?.emiratesId);
      addRow("Nationality", details?.nationality);
      addRow("Designation", details?.designation);
    }

    if (entityType === "individual") {
      addRow("Emirates ID", details?.emiratesId);
      addRow("Nationality", details?.nationality);
      addRow("Designation", details?.designation);
    }

    return rows;
  }, [details, entityType]);

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

  const documentCategoryCounts = useMemo(() => {
    const counts = { visa: 0, license: 0, other: 0 };

    for (const doc of sortedDocuments) {
      const templateMeta = doc.documentTemplate
        ? documentTemplateMap.get(doc.documentTemplate)
        : undefined;
      const category = normalizeDocumentCategory(
        doc.templateCategory || templateMeta?.category,
      );
      counts[category] += 1;
    }

    return counts;
  }, [documentTemplateMap, sortedDocuments]);

  const visibleCompanyDocumentTabs = useMemo(() => {
    const tabs: Array<{ key: "visa" | "license" | "other"; label: string }> = [
      { key: "visa", label: "Visa Related" },
      { key: "license", label: "License Related" },
    ];

    if (documentCategoryCounts.other > 0) {
      tabs.push({ key: "other", label: "Other" });
    }

    return tabs;
  }, [documentCategoryCounts.other]);

  useEffect(() => {
    if (entityType !== "company") {
      return;
    }

    if (documentCategoryTab === null) {
      return;
    }

    const isCurrentTabVisible = visibleCompanyDocumentTabs.some(
      (tab) => tab.key === documentCategoryTab,
    );

    if (!isCurrentTabVisible) {
      setDocumentCategoryTab(null);
    }
  }, [documentCategoryTab, entityType, visibleCompanyDocumentTabs]);

  const visibleDocuments = useMemo(() => {
    if (entityType !== "company") {
      return sortedDocuments;
    }

    if (documentCategoryTab === null) {
      return [];
    }

    return sortedDocuments.filter((doc) => {
      const templateMeta = doc.documentTemplate
        ? documentTemplateMap.get(doc.documentTemplate)
        : undefined;
      const category = normalizeDocumentCategory(
        doc.templateCategory || templateMeta?.category,
      );
      return category === documentCategoryTab;
    });
  }, [documentCategoryTab, documentTemplateMap, entityType, sortedDocuments]);

  const renewingDocument = useMemo(
    () => documents.find((doc) => doc._id === renewingDocId),
    [documents, renewingDocId],
  );

  const sortedCredentials = useMemo(() => {
    const clone = [...credentials];
    if (credentialSort === "platform-desc") {
      return clone.sort((a, b) =>
        (b.platform || "").localeCompare(a.platform || ""),
      );
    }
    if (credentialSort === "username-asc") {
      return clone.sort((a, b) =>
        (a.username || "").localeCompare(b.username || ""),
      );
    }
    return clone.sort((a, b) =>
      (a.platform || "").localeCompare(b.platform || ""),
    );
  }, [credentials, credentialSort]);

  const exportDocumentRows = async (
    format: "csv" | "excel" | "pdf",
    mode: "selected" | "all",
  ) => {
    const sourceRows = sortedDocuments;
    if (!sourceRows.length) {
      toast.error("No documents to export");
      return;
    }

    const rowsForExport = sourceRows.map((doc) => {
      const templateMeta = doc.documentTemplate
        ? documentTemplateMap.get(doc.documentTemplate)
        : undefined;
      const category = normalizeDocumentCategory(
        doc.templateCategory || templateMeta?.category,
      );

      return {
        DocumentName: doc.name || templateMeta?.name || "Untitled document",
        Category: getDocumentCategoryLabel(category),
        IssueDate: formatDate(doc.issueDate),
        ExpiryDate: formatDate(doc.expiryDate),
        Status: doc.archived
          ? "archived"
          : calculateStatus(doc.expiryDate || ""),
        Notes: doc.notes || "",
      };
    });

    if (format === "csv") {
      exportRowsCsv(rowsForExport, `${entityName}-documents`);
    } else if (format === "excel") {
      exportRowsExcel(rowsForExport, `${entityName}-documents`);
    } else {
      await exportRowsPdf(rowsForExport, `${entityName}-documents`);
    }

    const scopeLabel = mode === "selected" ? "Selected" : "All";
    toast.success(`${scopeLabel} documents exported as ${format.toUpperCase()}`);
  };

  const startRenew = (
    doc: NonNullable<EntityDetailResponse["data"]["documents"]>[number],
  ) => {
    setRenewingDocId(doc._id);
    setRenewExpiryDate(doc.expiryDate ? doc.expiryDate.slice(0, 10) : "");
  };

  const submitRenew = async (
    doc: NonNullable<EntityDetailResponse["data"]["documents"]>[number],
  ) => {
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

    const selectedTemplate = documentOptions.find(
      (item) => item.id === documentDraft.documentTemplate,
    );
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
        name: selectedTemplate?.name,
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
        await axios.put(`/api/${entityType}/${id}`, {
          documents: nextDocuments,
        });
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
      if (editingCredentialId) {
        await axios.put(
          `/api/${entityType}/${id}/credential/${editingCredentialId}`,
          {
            credentialTemplate: credentialDraft.credentialTemplate,
            username: credentialDraft.username,
            notes: credentialDraft.notes || undefined,
            password: credentialDraft.password,
          },
        );
        toast.success("Credential updated successfully");
      } else {
        await axios.put(`/api/${entityType}/${id}`, {
          credentials: nextCredentials,
        });
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
      await refetchEntity();
    } catch (error) {
      toast.error("Failed to add credential");
      console.error(error);
    } finally {
      setIsAddingCredential(false);
    }
  };

  const startEditDocument = (
    doc: NonNullable<EntityDetailResponse["data"]["documents"]>[number],
  ) => {
    setEditingDocumentId(doc._id);
    setDocumentDraft({
      documentTemplate: doc.documentTemplate || "",
      issueDate: doc.issueDate || "",
      expiryDate: doc.expiryDate || "",
      notes: doc.notes || "",
    });
    setShowAddDocument(true);
  };

  const startEditCredential = (
    item: NonNullable<EntityDetailResponse["data"]["credentials"]>[number],
  ) => {
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
    setDeleteDocumentConfirmId(docId);
    setShowDeleteDocumentConfirm(true);
  };

  const confirmDeleteDocument = async () => {
    if (!deleteDocumentConfirmId) {
      return;
    }
    try {
      setIsDeletingDocument(true);
      await axios.delete(`/api/${entityType}/${id}/doc/${deleteDocumentConfirmId}`);
      toast.success("Document deleted successfully");
      setShowDeleteDocumentConfirm(false);
      setDeleteDocumentConfirmId(null);
      await refetchEntity();
    } catch (error) {
      toast.error("Failed to delete document");
      console.error(error);
    } finally {
      setIsDeletingDocument(false);
    }
  };

  const archiveDocument = async (docId: string) => {
    setArchiveDocumentId(docId);
    setArchiveNoteDraft("");
    setShowArchiveDocumentModal(true);
  };

  const confirmArchiveDocument = async () => {
    if (!archiveDocumentId) {
      return;
    }

    try {
      setIsArchivingDocument(true);
      await axios.put(`/api/${entityType}/${id}/doc/${archiveDocumentId}`, {
        archived: true,
        archiveNotes: archiveNoteDraft.trim() || undefined,
      });
      toast.success("Document archived successfully");
      setShowArchiveDocumentModal(false);
      setArchiveDocumentId(null);
      setArchiveNoteDraft("");
      await refetchEntity();
    } catch (error) {
      toast.error("Failed to archive document");
      console.error(error);
    } finally {
      setIsArchivingDocument(false);
    }
  };

  const unarchiveDocument = async (docId: string) => {
    try {
      await axios.put(`/api/${entityType}/${id}/doc/${docId}`, {
        archived: false,
        archiveNotes: null,
      });
      toast.success("Document unarchived successfully");
      await refetchEntity();
    } catch (error) {
      toast.error("Failed to unarchive document");
      console.error(error);
    }
  };

  const deleteCredential = async (credentialId: string) => {
    setDeleteCredentialConfirmId(credentialId);
    setShowDeleteCredentialConfirm(true);
  };

  const confirmDeleteCredential = async () => {
    if (!deleteCredentialConfirmId) {
      return;
    }
    try {
      setIsDeletingCredential(true);
      await axios.delete(`/api/${entityType}/${id}/credential/${deleteCredentialConfirmId}`);
      toast.success("Credential deleted successfully");
      setShowDeleteCredentialConfirm(false);
      setDeleteCredentialConfirmId(null);
      await refetchEntity();
    } catch (error) {
      toast.error("Failed to delete credential");
      console.error(error);
    } finally {
      setIsDeletingCredential(false);
    }
  };

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

  const needsEntityData =
    section === "details" ||
    section === "documents" ||
    section === "credentials" ||
    section === "handovers" ||
    section === "invoices";
  const needsRecordsData = section === "records";
  const needsEmployeesData =
    section === "employees" && entityType === "company";
  const needsInvoicesData = false;
  const showOverviewSidebar = section === "overview";
  const isBaseLoading = !overviewRes;
  const isSectionLoading =
    (needsEntityData && !entityRes) ||
    (needsEmployeesData && !employeesByCompanyRes) ||
    (needsRecordsData && false) ||
    (needsInvoicesData && false);

  if (isBaseLoading) {
    return (
      <>
        <Breadcrumb pageName={`${entityName} / ${sectionTitle}`} />
        <EntitySectionSkeleton
          entityType={entityType}
          sectionTitle={sectionTitle}
        />
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName={`${entityName} / ${sectionTitle}`} />

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

      <ConfirmationModal
        isOpen={showDeleteDocumentConfirm}
        title="Delete Document"
        message="Delete this document? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeletingDocument}
        onCancel={() => {
          if (!isDeletingDocument) {
            setShowDeleteDocumentConfirm(false);
          }
        }}
        onConfirm={() => {
          void confirmDeleteDocument();
        }}
      />

      <ConfirmationModal
        isOpen={showDeleteCredentialConfirm}
        title="Delete Credential"
        message="Delete this credential? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeletingCredential}
        onCancel={() => {
          if (!isDeletingCredential) {
            setShowDeleteCredentialConfirm(false);
          }
        }}
        onConfirm={() => {
          void confirmDeleteCredential();
        }}
      />

      {showArchiveDocumentModal && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Archive Document
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add an optional archive note for this document.
            </p>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Archive Note
              </label>
              <textarea
                rows={3}
                value={archiveNoteDraft}
                onChange={(event) => setArchiveNoteDraft(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                placeholder="Reason for archiving (optional)"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isArchivingDocument) return;
                  setShowArchiveDocumentModal(false);
                  setArchiveDocumentId(null);
                  setArchiveNoteDraft("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void confirmArchiveDocument();
                }}
                disabled={isArchivingDocument}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
              >
                {isArchivingDocument ? "Archiving..." : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {renewingDocId && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Renew Document
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {renewingDocument?.name || "Selected document"}
            </p>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                New Expiry Date
              </label>
              <input
                type="date"
                value={renewExpiryDate}
                onChange={(event) => setRenewExpiryDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenewingDocId(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (renewingDocument) {
                    void submitRenew(renewingDocument);
                  }
                }}
                disabled={isRenewingDoc}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {isRenewingDoc ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <EntityProfileHeader
          entityType={entityType}
          name={entityName}
          avatarInitials={avatarInitials}
          avatarColor={avatarColor}
          companyName={entityType === "employee" ? companyName : undefined}
          companyAvatarInitials={
            entityType === "employee" ? companyAvatarInitials : undefined
          }
          companyAvatarColor={
            entityType === "employee" ? companyAvatarColor : undefined
          }
          onEditHref={`/${entityType}/${id}/edit`}
          onDelete={handleDeleteEntity}
          isDeleting={isDeletingEntity}
        />

        <EntityProfileTabs
          entityType={entityType}
          id={id}
          activeSection={section}
          sectionCounts={{
            details: counts?.details || 0,
            documents: counts?.documents || 0,
            credentials: counts?.credentials || 0,
            handovers: counts?.handovers || 0,
            tasks: counts?.tasks || 0,
            employees: counts?.employees || 0,
            records: counts?.records || 0,
            invoices: counts?.invoices || 0,
          }}
        />

        <div
          className={clsx(
            "grid gap-6",
            showOverviewSidebar
              ? "xl:grid-cols-[minmax(0,1.55fr)_360px]"
              : "grid-cols-1",
          )}
        >
          {section === "employees" ||
          section === "records" ||
          section === "invoices" ? (
            <>
              {isSectionLoading && (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
                </div>
              )}

              {!isSectionLoading &&
                section === "employees" &&
                entityType === "company" && (
                  <EmployeeList
                    employees={employeesByCompanyRes?.data}
                    pagination={employeesByCompanyRes?.pagination}
                    onPageChange={setEmployeePage}
                    pageSize={employeePageSize}
                    onPageSizeChange={(size) => {
                      setEmployeePageSize(size);
                      setEmployeePage(1);
                    }}
                    addEntityHref={`/employee/register/${id}?returnTo=${encodeURIComponent(`/${entityType}/${id}/employees`)}`}
                    addEntityLabel="Add Employee"
                  />
                )}

              {!isSectionLoading && section === "records" && (
                <TransactionList
                  type={entityType === "individual" ? "self" : entityType}
                  id={id}
                  embedded
                  lockEntityType={entityType}
                  lockEntityId={id}
                  lockEntityName={entityName}
                  returnTo={`/${entityType}/${id}/records`}
                />
              )}

              {!isSectionLoading && section === "invoices" && (
                <InvoiceList 
                  entityId={id} 
                  embedded 
                  returnTo={`/${entityType}/${id}/invoices`}
                />
              )}
            </>
          ) : (
            <SectionCard title={sectionTitle} description={sectionDescription(section)}>
              {isSectionLoading && (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
                </div>
              )}

              {!isSectionLoading && section === "tasks" && (
                <RelatedTasksPanel
                  targetType={entityType}
                  targetId={id}
                  targetLabel={entityName}
                />
              )}

              {!isSectionLoading && section === "details" && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-800/20">
                  {detailRows.length === 0 ? (
                    <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">
                      No details available.
                    </div>
                  ) : (
                    <table className="w-full">
                      <tbody>
                        {detailRows.map((row, index) => (
                          <tr
                            key={row.label}
                            className={clsx(
                              index !== detailRows.length - 1 &&
                                "border-b border-slate-200 dark:border-slate-700",
                            )}
                          >
                            <td className="w-44 bg-slate-100/50 px-6 py-4 text-sm font-semibold text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                              {row.label}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                              {typeof row.value === "boolean"
                                ? row.value
                                  ? "Yes"
                                  : "No"
                                : String(row.value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {!isSectionLoading && section === "documents" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <ExportActionsMenu onExport={exportDocumentRows} />
                    <select
                      value={documentSort}
                      onChange={(event) =>
                        setDocumentSort(
                          event.target.value as
                            | "expiry-asc"
                            | "expiry-desc"
                            | "name-asc",
                        )
                      }
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
                            setDocumentDraft({
                              documentTemplate: "",
                              issueDate: "",
                              expiryDate: "",
                              notes: "",
                            });
                          }
                          return next;
                        });
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700/50 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                    >
                      <FiPlus />
                      {showAddDocument
                        ? "Cancel"
                        : editingDocumentId
                          ? "Edit Document"
                          : "Add Document"}
                    </button>
                  </div>

                  {entityType === "company" && (
                    <div className="flex flex-wrap items-center gap-2">
                      {visibleCompanyDocumentTabs.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setDocumentCategoryTab(tab.key)}
                          className={clsx(
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition",
                            documentCategoryTab === tab.key
                              ? "border-cyan-300 bg-cyan-100 text-cyan-700 dark:border-cyan-600/60 dark:bg-cyan-500/15 dark:text-cyan-300"
                              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
                          )}
                        >
                          {tab.label}
                          <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-black text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                            {documentCategoryCounts[tab.key]}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showAddDocument && (
                    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
                      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {editingDocumentId ? "Edit Document" : "Add Document"}
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddDocument(false);
                              setEditingDocumentId(null);
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Close
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Document
                          </label>
                          <select
                            value={documentDraft.documentTemplate}
                            onChange={(event) =>
                              setDocumentDraft((prev) => ({
                                ...prev,
                                documentTemplate: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          >
                            <option value="">Select document</option>
                            {documentOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name || "Unnamed document"}
                              </option>
                            ))}
                          </select>
                          {selectedDocumentTemplate && (
                            <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 dark:border-emerald-900/40 dark:bg-emerald-900/20">
                              <span
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white"
                                style={{
                                  backgroundColor:
                                    selectedDocumentTemplate.color ||
                                    "#10B981",
                                }}
                              >
                                <SelectedDocumentTemplateIcon className="text-sm" />
                              </span>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {selectedDocumentTemplate.name || "Unnamed document"}
                              </span>
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                                {getDocumentCategoryLabel(selectedDocumentTemplateCategory)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Issue Date
                          </label>
                          <input
                            type="date"
                            value={documentDraft.issueDate}
                            onChange={(event) =>
                              setDocumentDraft((prev) => ({
                                ...prev,
                                issueDate: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            value={documentDraft.expiryDate}
                            onChange={(event) =>
                              setDocumentDraft((prev) => ({
                                ...prev,
                                expiryDate: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Notes
                          </label>
                          <textarea
                            rows={3}
                            value={documentDraft.notes}
                            onChange={(event) =>
                              setDocumentDraft((prev) => ({
                                ...prev,
                                notes: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                        <div className="mt-4 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddDocument(false);
                              setEditingDocumentId(null);
                            }}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Cancel
                          </button>
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
                    </div>
                  )}

                  {entityType === "company" && documentCategoryTab === null ? (
                    <div className="m-1 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-sm font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-500">
                      <FiFileText className="text-3xl opacity-30" />
                      <p>Select a category to view documents.</p>
                    </div>
                  ) : visibleDocuments.length === 0 ? (
                    <div className="m-1 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-sm font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-500">
                      <FiFileText className="text-3xl opacity-30" />
                      <p>
                        {documents.length === 0
                          ? "No physical documents recorded for this entity."
                          : "No documents in this category."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-800/20">
                      <div className="max-w-full overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                              <th className="px-4 py-3">Document</th>
                              <th className="px-4 py-3">Issue Date</th>
                              <th className="px-4 py-3">Expiry Date</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Notes</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleDocuments.map((doc) => {
                              const isArchived = Boolean(doc.archived);
                              const status = calculateStatus(doc.expiryDate || "");
                              const templateMeta = doc.documentTemplate
                                ? documentTemplateMap.get(doc.documentTemplate)
                                : undefined;
                              const templateCategory = normalizeDocumentCategory(
                                doc.templateCategory || templateMeta?.category,
                              );
                              const DocumentIcon = getDocumentCategoryIcon(templateCategory);
                              const docAvatarColor = resolveAvatarColorWithFallback(
                                templateMeta?.color,
                                templateMeta?.name || doc.name || "Document",
                              );

                              return (
                                <tr
                                  key={doc._id}
                                  className="border-b border-slate-200/70 align-top dark:border-slate-700/70"
                                >
                                  <td className="px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                      <span
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white"
                                        style={{ backgroundColor: docAvatarColor }}
                                      >
                                        <DocumentIcon className="text-sm" />
                                      </span>
                                      {doc.name || "Untitled document"}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                    {formatDate(doc.issueDate)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                    {formatDate(doc.expiryDate)}
                                  </td>
                                  <td className="px-4 py-3">
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
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                                    <div className="space-y-1">
                                      <p>{hasValue(doc.notes) ? doc.notes : "-"}</p>
                                      {hasValue(doc.archiveNotes) && (
                                        <p className="text-xs font-medium">
                                          Archive reason: {doc.archiveNotes}
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                      {!isArchived && (
                                        <button
                                          type="button"
                                          onClick={() => startRenew(doc)}
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-300 text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                                          title="Renew document"
                                        >
                                          <FiRefreshCw className="text-sm" />
                                        </button>
                                      )}
                                      {!isArchived && (
                                        <button
                                          type="button"
                                          onClick={() => archiveDocument(doc._id)}
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-300 text-amber-700 transition hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-500/10"
                                          title="Archive document"
                                        >
                                          <FiArchive className="text-sm" />
                                        </button>
                                      )}
                                      {isArchived && (
                                        <button
                                          type="button"
                                          onClick={() => unarchiveDocument(doc._id)}
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-300 text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                                          title="Unarchive document"
                                        >
                                          <FiUpload className="text-sm" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => startEditDocument(doc)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-blue-300 text-blue-700 transition hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-500/10"
                                        title="Edit document"
                                      >
                                        <FiEdit2 className="text-sm" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteDocument(doc._id)}
                                        className={clsx(
                                          "inline-flex h-8 w-8 items-center justify-center rounded-md border transition",
                                          "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/10",
                                        )}
                                        title="Delete document"
                                      >
                                        <FiTrash2 className="text-sm" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isSectionLoading && section === "credentials" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <select
                      value={credentialSort}
                      onChange={(event) =>
                        setCredentialSort(
                          event.target.value as
                            | "platform-asc"
                            | "platform-desc"
                            | "username-asc",
                        )
                      }
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
                            setCredentialDraft({
                              credentialTemplate: "",
                              username: "",
                              password: "",
                              notes: "",
                            });
                          }
                          return next;
                        });
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-700/50 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                    >
                      <FiPlus />
                      {showAddCredential
                        ? "Cancel"
                        : editingCredentialId
                          ? "Edit Credential"
                          : "Add Credential"}
                    </button>
                  </div>

                  {showAddCredential && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Platform
                          </label>
                          <select
                            value={credentialDraft.credentialTemplate}
                            onChange={(event) =>
                              setCredentialDraft((prev) => ({
                                ...prev,
                                credentialTemplate: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          >
                            <option value="">Select platform</option>
                            {credentialOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.platform || "Unnamed platform"}
                              </option>
                            ))}
                          </select>
                          {selectedCredentialTemplate && (
                            <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 dark:border-blue-900/40 dark:bg-blue-900/20">
                              <span
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white"
                                style={{
                                  backgroundColor:
                                    selectedCredentialTemplate.color ||
                                    "#2563EB",
                                }}
                              >
                                <FiLock className="text-sm" />
                              </span>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {selectedCredentialTemplate.platform ||
                                  "Unnamed platform"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Username
                          </label>
                          <input
                            type="text"
                            value={credentialDraft.username}
                            onChange={(event) =>
                              setCredentialDraft((prev) => ({
                                ...prev,
                                username: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Password
                          </label>
                          <input
                            type="text"
                            value={credentialDraft.password}
                            onChange={(event) =>
                              setCredentialDraft((prev) => ({
                                ...prev,
                                password: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Notes
                          </label>
                          <textarea
                            rows={3}
                            value={credentialDraft.notes}
                            onChange={(event) =>
                              setCredentialDraft((prev) => ({
                                ...prev,
                                notes: event.target.value,
                              }))
                            }
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
                    <div className="m-1 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-sm font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-500">
                      <FiLock className="text-3xl opacity-30" />
                      <p>No credentials recorded for this entity.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-800/20">
                      <div className="max-w-full overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                              <th className="px-4 py-3">Platform</th>
                              <th className="px-4 py-3">Username</th>
                              <th className="px-4 py-3">Password</th>
                              <th className="px-4 py-3">Notes</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedCredentials.map((item) => {
                              const isVisible = visibleCredentialIds.includes(
                                item._id,
                              );
                              const plainSecret =
                                item.credential || item.password || "";
                              const templateMeta = item.credentialTemplate
                                ? credentialTemplateMap.get(item.credentialTemplate)
                                : undefined;
                              const credentialAvatarColor = resolveAvatarColorWithFallback(
                                templateMeta?.color,
                                templateMeta?.platform || item.platform || "Credential",
                              );

                              return (
                                <tr
                                  key={item._id}
                                  className="border-b border-slate-200/70 align-top dark:border-slate-700/70"
                                >
                                  <td className="px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                      <span
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white"
                                        style={{ backgroundColor: credentialAvatarColor }}
                                      >
                                        <FiLock className="text-sm" />
                                      </span>
                                      {item.platform || "Unknown platform"}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                    {item.username || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                    <div className="inline-flex items-center gap-2">
                                      <span>
                                        {plainSecret
                                          ? isVisible
                                            ? plainSecret
                                            : "******"
                                          : "-"}
                                      </span>
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
                                          title={
                                            isVisible
                                              ? "Hide password"
                                              : "Show password"
                                          }
                                        >
                                          {isVisible ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                                    {hasValue(item.notes) ? item.notes : "-"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => startEditCredential(item)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-blue-300 text-blue-700 transition hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-500/10"
                                        title="Edit credential"
                                      >
                                        <FiEdit2 className="text-sm" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteCredential(item._id)}
                                        className={clsx(
                                          "inline-flex h-8 w-8 items-center justify-center rounded-md border transition",
                                          "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/10",
                                        )}
                                        title="Delete credential"
                                      >
                                        <FiTrash2 className="text-sm" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isSectionLoading && section === "handovers" && (
                <HandoverList
                  entityId={id}
                  entityName={entityName}
                  entityType={entityType}
                  compact
                />
              )}

            </SectionCard>
          )}

          {showOverviewSidebar && (
            <aside className="space-y-6 xl:sticky xl:top-6 self-start">
              <SectionCard
                title="Status"
                description="Current record state and related indicators."
              >
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
                  {hasValue(
                    entityRes?.data?.phone1 || entityRes?.data?.phone2,
                  ) && (
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
                  {entityType === "company" &&
                    hasValue(entityRes?.data?.emirates) && (
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
                <MetricCard
                  icon={<FiFolder />}
                  label="Documents"
                  value={counts?.documents || documents.length || 0}
                />
                <MetricCard
                  icon={<FiFileText />}
                  label="Handovers"
                  value={counts?.handovers || 0}
                />
                <MetricCard
                  icon={<FiLayers />}
                  label="Credentials"
                  value={counts?.credentials || credentials.length || 0}
                />
                {entityType === "company" && (
                  <MetricCard
                    icon={<FiUsers />}
                    label="Employees"
                    value={
                      counts?.employees ||
                      employeesByCompanyRes?.data?.length ||
                      0
                    }
                  />
                )}
                <MetricCard
                  icon={<FiCreditCard />}
                  label="Invoices"
                  value={counts?.invoices || 0}
                />
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
