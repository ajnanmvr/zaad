"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import HandoverList from "@/components/HandoverList";
import EmployeeList from "@/components/Tables/EmployeeList";
import { TEntityListItem, TPagination } from "@/types/types";

import axios from "axios";

type EntityType = "company" | "employee" | "individual";
type Section = "details" | "documents" | "credentials" | "handovers" | "employees" | "records" | "invoices";

type EntityDetailResponse = {
  data: {
    id: string;
    name: string;
    email?: string;
    phone1?: string;
    phone2?: string;
    remarks?: string;
    company?: { _id: string; name: string };
    documents?: Array<{ _id: string; name?: string; expiryDate?: string; notes?: string }>;
    credentials?: Array<{ _id: string; platform?: string; username?: string; notes?: string }>;
  };
};

export default function EntitySectionPage({
  entityType,
  id,
  section,
}: {
  entityType: EntityType;
  id: string;
  section: Section;
}) {
  const sectionTitle =
    section === "details"
      ? "Details"
      : section === "documents"
        ? "Documents"
        : section === "credentials"
          ? "Credentials"
          : section === "handovers"
            ? "Handovers"
            : section === "employees"
              ? "Employees"
              : section === "records"
                ? "Records"
                : "Invoices";

  const { data: entityRes } = useQuery<EntityDetailResponse>({
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
      const { data } = await axios.get(`/api/payment/${entityType}/${id}`);
      return data;
    },
    enabled: section === "records" && entityType !== "individual",
  });

  const { data: invoicesRes } = useQuery<any>({
    queryKey: ["entity-invoices", entityType, id, entityRes?.data?.name],
    queryFn: async () => {
      const name = entityRes?.data?.name || "";
      const { data } = await axios.get(`/api/invoice?page=0&search=${encodeURIComponent(name)}`);
      return data;
    },
    enabled: section === "invoices" && entityType !== "individual" && Boolean(entityRes?.data?.name),
  });

  const { data: employeesByCompanyRes } = useQuery<{ data: TEntityListItem[]; pagination: TPagination }>({
    queryKey: ["company-employees", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/employee/company/${id}?page=1&limit=100`);
      return data;
    },
    enabled: section === "employees" && entityType === "company",
  });

  const entityName = entityRes?.data?.name || "Entity";

  const documents = useMemo(() => entityRes?.data?.documents || [], [entityRes]);
  const credentials = useMemo(() => entityRes?.data?.credentials || [], [entityRes]);

  return (
    <>
      <Breadcrumb pageName={`${entityName} / ${sectionTitle}`} />

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">{sectionTitle}</h2>
          <Link
            href={`/${entityType}/${id}`}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Back to Overview
          </Link>
        </div>

        {section === "details" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
              <p className="text-xs uppercase tracking-wide text-slate-500">Name</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{entityRes?.data?.name || "-"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
              <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{entityRes?.data?.email || "-"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
              <p className="text-xs uppercase tracking-wide text-slate-500">Phone</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{entityRes?.data?.phone1 || "-"}</p>
            </div>
            {entityType === "employee" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="text-xs uppercase tracking-wide text-slate-500">Company</p>
                <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{entityRes?.data?.company?.name || "-"}</p>
              </div>
            )}
          </div>
        )}

        {section === "documents" && (
          <div className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-sm text-slate-500">No documents found.</p>
            ) : (
              documents.map((doc) => (
                <div key={doc._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{doc.name || "Untitled Document"}</p>
                  <p className="text-xs text-slate-500">Expiry: {doc.expiryDate || "-"}</p>
                </div>
              ))
            )}
          </div>
        )}

        {section === "credentials" && (
          <div className="space-y-2">
            {credentials.length === 0 ? (
              <p className="text-sm text-slate-500">No credentials found.</p>
            ) : (
              credentials.map((item) => (
                <div key={item._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{item.platform || "Unknown Platform"}</p>
                  <p className="text-xs text-slate-500">Username: {item.username || "-"}</p>
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
          <div className="space-y-2">
            {(recordsRes?.records || []).length === 0 ? (
              <p className="text-sm text-slate-500">No records found.</p>
            ) : (
              recordsRes.records.map((record: any) => (
                <div key={record.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{record.particular || "Transaction"}</p>
                  <p className="text-xs text-slate-500">{record.type} · {record.amount} AED · {record.date}</p>
                </div>
              ))
            )}
          </div>
        )}

        {section === "invoices" && (
          <div className="space-y-2">
            {(invoicesRes?.invoices || []).length === 0 ? (
              <p className="text-sm text-slate-500">No invoices found.</p>
            ) : (
              invoicesRes.invoices.map((invoice: any) => (
                <div key={invoice.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{invoice.invoiceNo}</p>
                  <p className="text-xs text-slate-500">{invoice.client} · {invoice.amount} AED · {invoice.date}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
