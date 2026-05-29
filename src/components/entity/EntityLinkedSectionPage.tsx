"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import EmployeeList from "@/components/Tables/EmployeeList";
import InvoiceList from "@/components/Tables/InvoiceList";
import TransactionList from "@/components/Tables/TransactionList";
import { hasPermission } from "@/auth/permissions";
import { useUserContext } from "@/contexts/UserContext";
import { TEntityListItem, TPaginatedResponse } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

type EntityType = "company" | "employee" | "individual";
type LinkedSection = "records" | "invoices" | "employees";

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function EntityLinkedSectionPage({
  entityType,
  id,
  section,
}: {
  entityType: EntityType;
  id: string;
  section: LinkedSection;
}) {
  const router = useRouter();
  const { user } = useUserContext();
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canViewInvoices = hasPermission(permissions, "payments.view.invoices");
  const [employeePage, setEmployeePage] = useState(1);
  const [employeePageSize, setEmployeePageSize] = useState(10);

  useEffect(() => {
    if (user && section === "invoices" && !canViewInvoices) {
      router.push("/");
    }
  }, [user, section, canViewInvoices, router]);

  const { data: entityResponse } = useQuery({
    queryKey: ["entity-linked-page", entityType, id],
    queryFn: async () => {
      const response = await axios.get(`/api/${entityType}/${id}`);
      return response.data;
    },
  });

  const entityData = entityResponse?.data || entityResponse;
  const entityName = String(entityData?.name || `${titleCase(entityType)} ${id}`);
  const profileHref = `/${entityType}/${id}/details`;

  const { data: employeesByCompanyRes, isLoading: employeesLoading } = useQuery<
    TPaginatedResponse<TEntityListItem>
  >({
    queryKey: ["employees-by-company-standalone", id, employeePage, employeePageSize],
    queryFn: async () => {
      const response = await axios.get(
        `/api/employee/company/${id}?page=${employeePage}&limit=${employeePageSize}`,
      );
      return response.data;
    },
    enabled: section === "employees" && entityType === "company",
  });

  const pageTitle =
    section === "records"
      ? `${entityName} Records`
      : section === "invoices"
        ? `${entityName} Invoices`
        : `${entityName} Employees`;

  if (section === "invoices" && (!user || !canViewInvoices)) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageName={pageTitle} />

      <div className="mb-6">
        <Link
          href={profileHref}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <FiArrowLeft /> Back to Profile
        </Link>
      </div>

      {section === "records" && (
        <TransactionList
          type={entityType === "individual" ? "self" : entityType}
          id={id}
          embedded
          enableSelection
          lockEntityType={entityType}
          lockEntityId={id}
          lockEntityName={entityName}
          returnTo={`/${entityType}/${id}/records`}
        />
      )}

      {section === "invoices" && (
        <InvoiceList entityId={id} embedded returnTo={`/${entityType}/${id}/invoices`} />
      )}

      {section === "employees" && entityType === "company" && (
        <EmployeeList
          employees={employeesByCompanyRes?.data}
          isLoading={employeesLoading}
          pagination={employeesByCompanyRes?.pagination}
          onPageChange={setEmployeePage}
          pageSize={employeePageSize}
          onPageSizeChange={(size) => {
            setEmployeePageSize(size);
            setEmployeePage(1);
          }}
          addEntityHref={`/employee/register/${id}?returnTo=${encodeURIComponent(`/company/${id}/employees`)}`}
          addEntityLabel="Add Employee"
        />
      )}
    </>
  );
}
