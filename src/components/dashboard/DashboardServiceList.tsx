"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { FiArrowUpRight } from "react-icons/fi";
import { useUserContext } from "@/contexts/UserContext";
import { hasPermission } from "@/auth/permissions";
import {
  SERVICE_KINDS,
  SERVICE_KIND_LABELS,
  SERVICE_KIND_OPTIONS,
  SERVICE_KIND_SHORT_LABELS,
  ServiceKind,
  normalizeServiceKind,
} from "@/config/serviceKinds";
import {
  getServiceKindAccent,
  getServiceKindIcon,
} from "@/config/serviceKindVisuals";

type ServiceItem = {
  id: string;
  name: string;
  price: number;
  kind: ServiceKind;
  color?: string;
};

const VIEW_PERMISSIONS = [
  "settings.manage.services",
  "payments.write",
  "payments.read",
  "payments.create.transactions",
  "payments.view.transactions",
];

const MANAGE_PERMISSIONS = [
  "settings.manage.services",
  "payments.write",
  "settings.write",
];

const priceFormatter = new Intl.NumberFormat("en-AE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function DashboardServiceList() {
  const { user } = useUserContext();
  const permissions = Array.isArray(user?.permissions)
    ? (user.permissions as string[])
    : [];
  const canView = VIEW_PERMISSIONS.some((permission) =>
    hasPermission(permissions, permission),
  );
  const canManage = MANAGE_PERMISSIONS.some((permission) =>
    hasPermission(permissions, permission),
  );

  const [kindFilter, setKindFilter] = useState<ServiceKind | "all">("all");

  const { data: items = [], isLoading } = useQuery<ServiceItem[]>({
    queryKey: ["service-templates", "dashboard"],
    queryFn: async () => {
      const { data } = await axios.get("/api/templates", {
        params: { type: "service" },
      });
      return ((data?.options || []) as any[])
        .filter((option) => option?.published !== false)
        .map((option) => ({
          id: String(option?.id || ""),
          name: String(option?.name || ""),
          price: Number(option?.price) || 0,
          kind: normalizeServiceKind(option?.kind),
          color: option?.color,
        })) as ServiceItem[];
    },
    enabled: canView,
    staleTime: 5 * 60 * 1000,
  });

  const groups = useMemo(() => {
    const sorted = [...items].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
    return SERVICE_KINDS.map((groupKind) => ({
      kind: groupKind,
      label: SERVICE_KIND_LABELS[groupKind],
      rows: sorted.filter(
        (item) =>
          item.kind === groupKind &&
          (kindFilter === "all" || kindFilter === groupKind),
      ),
    })).filter((group) => group.rows.length > 0);
  }, [items, kindFilter]);

  if (!canView) return null;

  const kindTabs: Array<{ value: ServiceKind | "all"; label: string }> = [
    { value: "all", label: "All" },
    ...SERVICE_KIND_OPTIONS.map((option) => ({
      value: option.value,
      label: SERVICE_KIND_SHORT_LABELS[option.value],
    })),
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">
            Reference
          </p>
          <h2 className="mt-1 text-sm font-black tracking-tight text-slate-950 dark:text-white sm:text-base">
            Service Pricelist
          </h2>
        </div>
        {canManage && (
          <Link
            href="/settings/services"
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
          >
            Manage
            <FiArrowUpRight />
          </Link>
        )}
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        {items.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            {kindTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setKindFilter(tab.value)}
                className={clsx(
                  "rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition",
                  kindFilter === tab.value
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading services...
          </p>
        ) : groups.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {items.length === 0
              ? "No services in the catalogue yet."
              : "No services in this category."}
          </p>
        ) : (
          <div className="max-h-[420px] space-y-5 overflow-y-auto pr-1">
            {groups.map((group) => {
              const GroupIcon = getServiceKindIcon(group.kind);
              const accent = getServiceKindAccent(group.kind);
              return (
                <div key={group.kind}>
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-white"
                      style={{ backgroundColor: accent }}
                    >
                      <GroupIcon className="text-xs" />
                    </span>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {group.label}
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-400">
                      ({group.rows.length})
                    </span>
                  </div>
                  <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                    {group.rows.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 border-b border-slate-100 py-1.5 text-sm last:border-b-0 dark:border-slate-800"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: item.color || accent,
                          }}
                        />
                        <span className="truncate text-slate-700 dark:text-slate-200">
                          {item.name}
                        </span>
                        <span className="hidden h-0 flex-1 border-b border-dotted border-slate-300 dark:border-slate-700 sm:block" />
                        <span className="ml-auto shrink-0 font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-slate-100 sm:ml-0">
                          <span className="mr-1 text-[10px] font-semibold text-slate-400">
                            AED
                          </span>
                          {priceFormatter.format(item.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default DashboardServiceList;
