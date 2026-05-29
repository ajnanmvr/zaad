"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import InvoiceList from "@/components/Tables/InvoiceList";
import { hasPermission } from "@/auth/permissions";
import { useUserContext } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FiFileText, FiLayers, FiSearch } from "react-icons/fi";

export default function Invoice() {
  const router = useRouter();
  const { user } = useUserContext();
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canViewInvoices = hasPermission(permissions, "payments.view.invoices");

  useEffect(() => {
    if (user && !canViewInvoices) {
      router.push("/not-permitted");
    }
  }, [user, canViewInvoices, router]);

  if (!user || !canViewInvoices) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Invoices" />

      <section className="relative overflow-hidden rounded-3xl border border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 shadow-sm dark:border-violet-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/60 bg-violet-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700 dark:border-violet-700/40 dark:bg-violet-900/30 dark:text-violet-300">
              <FiFileText />
              Billing Center
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Invoices
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Manage issued invoices, review billing history, and jump into edit or detail views quickly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Workflow</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-slate-900 dark:text-slate-100">
                <FiLayers />
                Draft, Review, Publish
              </p>
            </div>
            <div className="rounded-2xl border border-violet-200/80 bg-white/80 p-4 dark:border-violet-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Currency</p>
              <p className="mt-1 text-sm font-black text-violet-600 dark:text-violet-400">AED Statements</p>
            </div>
            <div className="rounded-2xl border border-cyan-200/80 bg-white/80 p-4 dark:border-cyan-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Quick Find</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-cyan-600 dark:text-cyan-400">
                <FiSearch />
                Search & Filter
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <InvoiceList />
      </div>
    </>
  )
}
