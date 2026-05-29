"use client";

import Link from "next/link";
import { useUserContext } from "@/contexts/UserContext";
import { hasPermission } from "@/auth/permissions";
import {
  FiArrowUpRight,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCreditCard,
  FiFileText,
  FiFolder,
  FiFolderPlus,
  FiHome,
  FiLayers,
  FiLock,
  FiSettings,
  FiShield,
  FiTrendingDown,
  FiTrendingUp,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";

const tiles = [
  {
    label: "Business Pulse",
    href: "/business-pulse",
    description: "Quick analytics",
    icon: <FiTrendingUp className="h-6 w-6" />,
    accent: "from-cyan-500 via-sky-500 to-blue-600",
    permissions: ["payments.view.finance-summary-page"],
    section: "Dashboard",
  },
  {
    label: "My Tasks",
    href: "/tasks",
    description: "Assigned work",
    icon: <FiCalendar className="h-6 w-6" />,
    accent: "from-lime-500 via-emerald-500 to-teal-500",
    permissions: ["tasks.read", "tasks.complete", "tasks.manage"],
    section: "Dashboard",
  },
  {
    label: "Task Calendar",
    href: "/tasks/manage",
    description: "Schedule view",
    icon: <FiCalendar className="h-6 w-6" />,
    accent: "from-emerald-500 via-lime-500 to-teal-500",
    permissions: ["tasks.manage"],
    section: "Dashboard",
  },
  {
    label: "Companies",
    href: "/company",
    description: "Company records",
    icon: <FiBriefcase className="h-6 w-6" />,
    accent: "from-sky-500 via-indigo-500 to-violet-600",
    permissions: ["entities.read"],
    section: "Entities",
  },
  {
    label: "Employees",
    href: "/employee",
    description: "Team records",
    icon: <FiUsers className="h-6 w-6" />,
    accent: "from-emerald-500 via-teal-500 to-cyan-600",
    permissions: ["entities.read"],
    section: "Entities",
  },
  {
    label: "Individuals",
    href: "/individual",
    description: "Personal files",
    icon: <FiUserPlus className="h-6 w-6" />,
    accent: "from-amber-500 via-orange-500 to-rose-500",
    permissions: ["entities.read"],
    section: "Entities",
  },
  {
    label: "Add Company",
    href: "/company/register",
    description: "New company",
    icon: <FiLayers className="h-6 w-6" />,
    accent: "from-sky-500 via-cyan-500 to-blue-600",
    permissions: ["entities.write"],
    section: "Entities",
  },
  {
    label: "Add Employee",
    href: "/employee/register",
    description: "New employee",
    icon: <FiUserPlus className="h-6 w-6" />,
    accent: "from-emerald-500 via-lime-500 to-teal-500",
    permissions: ["entities.write"],
    section: "Entities",
  },
  {
    label: "Add Individual",
    href: "/individual/register",
    description: "New individual",
    icon: <FiUserPlus className="h-6 w-6" />,
    accent: "from-amber-500 via-orange-500 to-yellow-500",
    permissions: ["entities.write"],
    section: "Entities",
  },
  {
    label: "Finance Summary",
    href: "/accounts/transactions/analytics",
    description: "Overview charts",
    icon: <FiTrendingUp className="h-6 w-6" />,
    accent: "from-cyan-500 via-sky-500 to-indigo-600",
    permissions: ["payments.view.finance-summary-page"],
    section: "Finance",
  },
  {
    label: "Finance Reports",
    href: "/accounts/transactions/reports",
    description: "Summary reports",
    icon: <FiFileText className="h-6 w-6" />,
    accent: "from-slate-600 via-slate-800 to-slate-950",
    permissions: ["payments.view.records-summary"],
    section: "Finance",
  },
  {
    label: "All Transactions",
    href: "/accounts/transactions",
    description: "All payments",
    icon: <FiCreditCard className="h-6 w-6" />,
    accent: "from-violet-500 via-fuchsia-500 to-rose-500",
    permissions: ["payments.view.transactions"],
    section: "Finance",
  },
  {
    label: "New Income",
    href: "/accounts/add-record?type=income",
    description: "Create income",
    icon: <FiTrendingUp className="h-6 w-6" />,
    accent: "from-emerald-500 via-teal-500 to-cyan-600",
    permissions: ["payments.create.transactions"],
    section: "Finance",
  },
  {
    label: "New Expense",
    href: "/accounts/add-record?type=expense",
    description: "Create expense",
    icon: <FiTrendingDown className="h-6 w-6" />,
    accent: "from-rose-500 via-pink-500 to-orange-500",
    permissions: ["payments.create.transactions"],
    section: "Finance",
  },
  {
    label: "Office Records",
    href: "/accounts/transactions/office",
    description: "Office flow",
    icon: <FiBookOpen className="h-6 w-6" />,
    accent: "from-orange-500 via-amber-500 to-yellow-500",
    permissions: ["payments.view.office-records"],
    section: "Finance",
  },
  {
    label: "Self Transfers",
    href: "/accounts/transactions/self",
    description: "Internal moves",
    icon: <FiArrowUpRight className="h-6 w-6" />,
    accent: "from-teal-500 via-cyan-500 to-sky-600",
    permissions: ["payments.view.self-transfers"],
    section: "Finance",
  },
  {
    label: "Credit List",
    href: "/accounts/transactions/credit-list",
    description: "Credit entries",
    icon: <FiTrendingUp className="h-6 w-6" />,
    accent: "from-emerald-500 via-teal-500 to-cyan-600",
    permissions: ["payments.view.credit-debit-lists"],
    section: "Finance",
  },
  {
    label: "Debit List",
    href: "/accounts/transactions/debit-list",
    description: "Debit entries",
    icon: <FiTrendingDown className="h-6 w-6" />,
    accent: "from-rose-500 via-pink-500 to-orange-500",
    permissions: ["payments.view.credit-debit-lists"],
    section: "Finance",
  },
  {
    label: "Liability",
    href: "/accounts/transactions/liability",
    description: "Debt tracking",
    icon: <FiShield className="h-6 w-6" />,
    accent: "from-rose-500 via-red-500 to-orange-600",
    permissions: ["payments.view.liability-records"],
    section: "Finance",
  },
  {
    label: "Invoices",
    href: "/accounts/invoice",
    description: "Invoice list",
    icon: <FiFileText className="h-6 w-6" />,
    accent: "from-rose-500 via-pink-500 to-orange-500",
    permissions: ["payments.view.invoices"],
    section: "Finance",
  },
  {
    label: "New Invoice",
    href: "/accounts/invoice/new",
    description: "Create invoice",
    icon: <FiArrowUpRight className="h-6 w-6" />,
    accent: "from-slate-900 via-slate-800 to-cyan-900",
    permissions: ["payments.create.invoices"],
    section: "Finance",
  },
  {
    label: "Expiry Documents",
    href: "/documents/expiry",
    description: "Expiry docs",
    icon: <FiBookOpen className="h-6 w-6" />,
    accent: "from-orange-500 via-amber-500 to-yellow-500",
    permissions: ["documents.read"],
    section: "Documents",
  },
  {
    label: "Physical Handover",
    href: "/documents/handover",
    description: "Handover logs",
    icon: <FiFolder className="h-6 w-6" />,
    accent: "from-teal-500 via-cyan-500 to-sky-600",
    permissions: ["documents.read"],
    section: "Documents",
  },
  {
    label: "Settings Home",
    href: "/settings",
    description: "Main settings",
    icon: <FiSettings className="h-6 w-6" />,
    accent: "from-slate-600 via-slate-800 to-slate-950",
    permissions: ["settings.read", "settings.write"],
    section: "Administration",
  },
  {
    label: "Roles & Permissions",
    href: "/settings/roles",
    description: "Access control",
    icon: <FiShield className="h-6 w-6" />,
    accent: "from-slate-700 via-slate-800 to-cyan-900",
    permissions: ["settings.manage.roles", "settings.manage.permissions", "roles.manage"],
    section: "Administration",
  },
  {
    label: "Change Password",
    href: "/settings/change-password",
    description: "Security update",
    icon: <FiLock className="h-6 w-6" />,
    accent: "from-slate-900 via-slate-800 to-slate-700",
    permissions: ["users.read", "settings.read"],
    section: "Administration",
  },
  {
    label: "Document Types",
    href: "/settings/document-types",
    description: "Type templates",
    icon: <FiLayers className="h-6 w-6" />,
    accent: "from-sky-500 via-cyan-500 to-blue-600",
    permissions: ["settings.manage.document-types"],
    section: "Types & Platforms",
  },
  {
    label: "Credential Platforms",
    href: "/settings/credential-platforms",
    description: "Credential groups",
    icon: <FiBriefcase className="h-6 w-6" />,
    accent: "from-emerald-500 via-teal-500 to-cyan-600",
    permissions: ["settings.manage.credential-platforms"],
    section: "Types & Platforms",
  },
  {
    label: "Office Categories",
    href: "/settings/office-expense-categories",
    description: "Office groups",
    icon: <FiBookOpen className="h-6 w-6" />,
    accent: "from-orange-500 via-amber-500 to-yellow-500",
    permissions: ["settings.manage.office-categories"],
    section: "Types & Platforms",
  },
  {
    label: "Payment Methods",
    href: "/settings/payment-methods",
    description: "Method list",
    icon: <FiCreditCard className="h-6 w-6" />,
    accent: "from-violet-500 via-fuchsia-500 to-pink-600",
    permissions: ["settings.manage.payment-methods"],
    section: "Types & Platforms",
  },
  {
    label: "Payment Statuses",
    href: "/settings/payment-statuses",
    description: "Status list",
    icon: <FiFileText className="h-6 w-6" />,
    accent: "from-rose-500 via-pink-500 to-orange-500",
    permissions: ["settings.manage.payment-statuses"],
    section: "Types & Platforms",
  },
  {
    label: "Particular Suggestions",
    href: "/settings/particular-suggestions",
    description: "Quick text",
    icon: <FiFileText className="h-6 w-6" />,
    accent: "from-teal-500 via-cyan-500 to-sky-600",
    permissions: ["settings.manage.particular-suggestions"],
    section: "Types & Platforms",
  },
  {
    label: "System Users",
    href: "/users",
    description: "User access",
    icon: <FiUsers className="h-6 w-6" />,
    accent: "from-slate-700 via-slate-800 to-cyan-900",
    permissions: ["users.read"],
    section: "Users",
  },
];

const sections = [
  {
    title: "Overview",
    subtitle: "Overview and workflow",
    tileLabels: ["Dashboard", "Business Pulse", "My Tasks", "Task Calendar", "Expiry Documents", "Physical Handover"],
  },
  {
    title: "Entities",
    subtitle: "People and companies",
    tileLabels: ["Companies", "Employees", "Individuals", "Add Company", "Add Employee", "Add Individual"],
  },
  {
    title: "Finance",
    subtitle: "Payments and billing",
    tileLabels: [
      "Finance Summary",
      "Finance Reports",
      "All Transactions",
      "Create Records",
      "New Income",
      "New Expense",
      "Office Records",
      "Self Transfers",
      "Credit / Debit Lists",
      "Credit List",
      "Debit List",
      "Liability",
      "Invoices",
      "New Invoice",
    ],
  },
  {
    title: "Types & Platforms",
    subtitle: "Settings groups",
    tileLabels: ["Document Types", "Credential Platforms", "Office Categories", "Payment Methods", "Payment Statuses", "Particular Suggestions"],
  },
  {
    title: "Administration",
    subtitle: "System control",
    tileLabels: ["Settings Home", "Roles & Permissions", "Change Password", "System Users"],
  },

];

export default function Home() {
  const { user } = useUserContext();
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];

  const visibleTiles = tiles.filter(
    (tile) => tile.permissions.length === 0 || tile.permissions.some((permission) => hasPermission(permissions, permission)),
  );

  const tilesByLabel = new Map(visibleTiles.map((tile) => [tile.label, tile]));
  const visibleSections = sections
    .map((section) => ({
      ...section,
      tiles: section.tileLabels
        .map((label) => tilesByLabel.get(label))
        .filter((tile): tile is (typeof tiles)[number] => Boolean(tile)),
    }))
    .filter((section) => section.tiles.length > 0);

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="space-y-6">
        {visibleSections.map((section) => (
          <section key={section.title} className="space-y-3">
            <div className="flex items-end justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">
                  {section.subtitle}
                </p>
                <h2 className="mt-1 text-sm font-black tracking-tight text-slate-950 dark:text-white sm:text-base">
                  {section.title}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {section.tiles.map((tile) => (
                <Link
                  key={tile.label}
                  href={tile.href}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${tile.accent} opacity-0 transition group-hover:opacity-20`} />
                  <div className="relative flex min-h-32 flex-col items-start justify-between gap-4">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tile.accent} text-white shadow-lg shadow-slate-950/15 transition group-hover:scale-105`}>
                      {tile.icon}
                    </div>
                    <div className="flex w-full items-end justify-between gap-3">
                      <div>
                        <span className="block text-sm font-black tracking-tight text-slate-950 dark:text-white">
                          {tile.label}
                        </span>
                        <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {tile.description}
                        </span>
                      </div>
                      <FiArrowUpRight className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-950 dark:group-hover:text-white" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
