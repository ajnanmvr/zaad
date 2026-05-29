"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import BusinessPulseDashboard from "@/components/dashboard/BusinessPulseDashboard";
import { hasPermission } from "@/auth/permissions";
import { useUserContext } from "@/contexts/UserContext";

export default function Page() {
  const router = useRouter();
  const { user } = useUserContext();
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canViewBusinessPulse =
    hasPermission(permissions, "dashboard.view.business-pulse") ||
    hasPermission(permissions, "payments.view.finance-summary-page");

  useEffect(() => {
    if (user && !canViewBusinessPulse) {
      router.push("/not-permitted");
    }
  }, [user, canViewBusinessPulse, router]);

  if (!user || !canViewBusinessPulse) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  return <BusinessPulseDashboard />;
}
