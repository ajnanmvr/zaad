"use client";

import Link from "next/link";
import {
  FiArrowRight,
  FiBriefcase,
  FiFileText,
  FiLayers,
  FiLink,
  FiSettings,
  FiShield,
  FiUser,
  FiUsers,
} from "react-icons/fi";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUserContext } from "@/contexts/UserContext";

export default function SettingsPage() {
  const { user } = useUserContext();

  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const can = (permission: string) => userPermissions.includes(permission);

  const canViewRoles =
    can("settings.read") || can("roles.manage") || can("settings.manage.roles");
  const canViewPermissions = can("settings.read") || can("settings.manage.permissions");
  const canViewDocumentTypes = can("entities.write") || can("settings.write") || can("settings.manage.document-types");
  const canViewCredentialPlatforms = can("entities.write") || can("settings.write") || can("settings.manage.credential-platforms");
  const canViewOfficeCategories = can("payments.write") || can("settings.write") || can("settings.manage.office-categories");
  const canViewPaymentMethods = can("payments.write") || can("settings.write") || can("settings.manage.payment-methods");
  const canViewPaymentStatuses = can("payments.write") || can("settings.write") || can("settings.manage.payment-statuses");
  const canViewParticularSuggestions = can("settings.write") || can("payments.manage.particular-suggestions") || can("settings.manage.particular-suggestions");
  const canViewAudit =
    can("users.activity.read");
  const canViewUsers =
    can("users.read");

  const navigationItems = [
    {
      href: "/settings/document-types",
      title: "Document Types",
      description: "Manage document type templates.",
      icon: FiLayers,
      visible: canViewDocumentTypes,
    },
    {
      href: "/settings/credential-platforms",
      title: "Credential Platforms",
      description: "Manage credential platform options.",
      icon: FiFileText,
      visible: canViewCredentialPlatforms,
    },
    {
      href: "/settings/office-expense-categories",
      title: "Office Categories",
      description: "Manage office expense categories.",
      icon: FiBriefcase,
      visible: canViewOfficeCategories,
    },
    {
      href: "/settings/payment-methods",
      title: "Payment Methods",
      description: "Manage payment method options.",
      icon: FiLink,
      visible: canViewPaymentMethods,
    },
    {
      href: "/settings/payment-statuses",
      title: "Payment Statuses",
      description: "Manage payment status options.",
      icon: FiShield,
      visible: canViewPaymentStatuses,
    },
    {
      href: "/settings/particular-suggestions",
      title: "Particular Suggestion",
      description: "Review saved transaction description suggestions.",
      icon: FiLink,
      visible: canViewParticularSuggestions,
    },
    {
      href: "/settings/roles",
      title: "Roles",
      description: "Manage roles and inspect permission groups.",
      icon: FiShield,
      visible: canViewRoles,
    },
    {
      href: "/settings/permissions",
      title: "Permissions",
      description: "View access permissions in one place.",
      icon: FiShield,
      visible: canViewPermissions,
    },
    {
      href: "/settings/my-activity",
      title: "My Activity",
      description: "Open your activity log.",
      icon: FiUser,
      visible: canViewAudit,
    },
    {
      href: "/settings/change-password",
      title: "Change Password",
      description: "Update your account password.",
      icon: FiShield,
      visible: true,
    },
    {
      href: "/settings/active-sessions",
      title: "Active Sessions",
      description: "Review and revoke logged-in devices.",
      icon: FiBriefcase,
      visible: true,
    },
    {
      href: "/users",
      title: "System Users",
      description: "Open user administration.",
      icon: FiUsers,
      visible: canViewUsers,
    },
    {
      href: "/users/activity",
      title: "Activity Audit",
      description: "Inspect account activity records.",
      icon: FiSettings,
      visible: canViewAudit,
    },
  ];

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <Breadcrumb pageName="Settings" />

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
              <FiSettings />
              Settings
            </p>
            <h1 className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Account and system settings
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Open the section you need. Each setting now lives on its own page.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            <div className="font-semibold">{user?.fullname || user?.username || "User"}</div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 capitalize">
              {user?.role || "role"}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {navigationItems.filter((item) => item.visible).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:px-5"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Icon className="text-base" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h2>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
                <FiArrowRight className="text-slate-400" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
