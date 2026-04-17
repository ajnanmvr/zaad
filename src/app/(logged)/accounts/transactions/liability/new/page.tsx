import React, { Suspense } from "react";
import Link from "next/link";

import AddRecord from "@/components/Forms/AddRecord";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

const LiabilityEntryPage = ({ searchParams }: { searchParams?: { flow?: string } }) => {
  const flow = searchParams?.flow === "in" ? "in" : "out";
  const type = flow === "in" ? "income" : "expense";
  const suggestionCategory = flow === "in" ? "liability_in" : "liability_out";

  return (
    <>
      <Breadcrumb pageName="Liability Entry" />
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/accounts/transactions/liability/new?flow=in"
          className={flow === "in" ? "rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white" : "rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"}
        >
          Liability In
        </Link>
        <Link
          href="/accounts/transactions/liability/new?flow=out"
          className={flow === "out" ? "rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white" : "rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"}
        >
          Liability Out
        </Link>
      </div>
      <Suspense fallback={null}>
        <AddRecord
          type={type}
          suggestionCategory={suggestionCategory}
          forceRecordKind="liability"
          hidePaymentStatus
          hideBreadcrumb
        />
      </Suspense>
    </>
  );
};

export default LiabilityEntryPage;
