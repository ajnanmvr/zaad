"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import SessionManager from "@/components/Settings/SessionManager";

export default function ActiveSessionsPage() {
  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <Breadcrumb pageName="Active Sessions" />
      <div className="mt-6">
        <SessionManager />
      </div>
    </div>
  );
}
