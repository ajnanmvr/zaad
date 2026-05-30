"use client";

import React, { useState } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useUserContext } from "@/contexts/UserContext";
import { hasPermission } from "@/auth/permissions";
import { FiRefreshCw } from "react-icons/fi";

export default function AdminRefreshButton({
  invalidateKeys = [],
  label = "Refresh Precomputations",
  className = "",
  extraEndpoints = [],
}: {
  // allow simple string keys or composite query keys arrays
  invalidateKeys?: Array<string | any[]>;
  label?: string;
  className?: string;
  extraEndpoints?: string[];
}) {
  const { user } = useUserContext();
  const permissions = user?.permissions && Array.isArray(user.permissions) ? (user.permissions as string[]) : [];
  const canAdminRefresh = user ? hasPermission(permissions, "payments.manage.recompute-monthly-stats") || hasPermission(permissions, "payments.admin") || hasPermission(permissions, "admin.access") : false;
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!canAdminRefresh) return null;

  const handleClick = async () => {
    try {
      setIsRefreshing(true);
      // Core recompute endpoints: ledger stats (entities/office/liability), historical backfill, and current-month recompute
      const defaultCalls = [
        axios.post("/api/payment/entity-stats/recompute"),
        axios.post("/api/admin/payment/backfill-monthly-stats"),
        axios.post("/api/payment/monthly-stats/recompute"),
      ];

      const extraCalls = (extraEndpoints || []).map((ep) => axios.post(ep));

      const [ledgerResp, backfillResp, monthlyRecomputeResp] = await Promise.all([
        ...defaultCalls,
        ...extraCalls,
      ]);

      const updatedEntities = Number(ledgerResp?.data?.updatedEntities || 0);
      const updatedOfficeCategories = Number(ledgerResp?.data?.updatedOfficeCategories || 0);
      const updatedLiabilityEntities = Number(ledgerResp?.data?.updatedLiabilityEntities || 0);
      const months = Number(backfillResp?.data?.computedMonths || 0) || Number(monthlyRecomputeResp?.data?.summary?.computedMonths || 0);

      for (const key of invalidateKeys || []) {
        try {
          if (Array.isArray(key)) {
            await queryClient.invalidateQueries({ queryKey: key });
          } else {
            await queryClient.invalidateQueries({ queryKey: [key] });
          }
        } catch (e) {
          // best-effort
        }
      }

      // refetch the invalidated queries
      for (const key of invalidateKeys || []) {
        try {
          if (Array.isArray(key)) {
            await queryClient.refetchQueries({ queryKey: key });
          } else {
            await queryClient.refetchQueries({ queryKey: [key] });
          }
        } catch (e) {
          // ignore
        }
      }

      toast.success(`Refreshed precomputed stats (${updatedEntities} entities, ${updatedOfficeCategories} office categories, ${updatedLiabilityEntities} liability entities, ${months} months)`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to refresh precomputations");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isRefreshing}
      className={className}
    >
      <FiRefreshCw /> {isRefreshing ? "Refreshing..." : label}
    </button>
  );
}
