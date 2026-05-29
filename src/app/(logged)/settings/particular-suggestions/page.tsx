"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ParticularSuggestionsManager from "@/components/Settings/ParticularSuggestionsManager";
import { useUserContext } from "@/contexts/UserContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ParticularSuggestionsPage = () => {
  const { user, isUserLoading } = useUserContext();
  const router = useRouter();
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canViewSuggestions =
    permissions.includes("settings.manage.particular-suggestions") ||
    permissions.includes("payments.manage.particular-suggestions") ||
    permissions.includes("settings.write");

  useEffect(() => {
    if (!isUserLoading && user && !canViewSuggestions) {
      router.replace("/not-permitted");
    }
  }, [isUserLoading, user, canViewSuggestions, router]);

  return (
    <>
      <Breadcrumb pageName="Particular Suggestions" />
      {isUserLoading || (!canViewSuggestions && user) ? (
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
          Loading access...
        </div>
      ) : (
        <div className="mx-auto max-w-6xl">
          <ParticularSuggestionsManager />
        </div>
      )}
    </>
  );
};

export default ParticularSuggestionsPage;
