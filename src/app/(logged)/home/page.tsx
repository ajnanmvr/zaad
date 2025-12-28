"use client";
import Link from "next/link";
import { useUserContext } from "@/contexts/UserContext";

export default function HomePage() {
  const { user } = useUserContext();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-6 border-b border-stroke bg-white/70 backdrop-blur-lg dark:border-strokedark dark:bg-boxdark/70 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-black dark:text-white">
              {user?.fullname || user?.username ? `Welcome, ${user?.fullname || user?.username}` : "Welcome"}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {user?.role ? `Role: ${user?.role}` : "Sign in to access your data"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <QuickLink
          title="View Accounts"
          description="Browse clients and accounts at a glance"
          href="/accounts/clients"
        />
        <QuickLink
          title="Transactions"
          description="Record deposits, expenses, and transfers"
          href="/accounts/transactions"
        />
        <QuickLink
          title="Add Company"
          description="Register a new company entity"
          href="/company/register"
        />
        <QuickLink
          title="Add Individual"
          description="Create a new employee record"
          href="/employee/register"
        />
        {user?.role === "partner" || user?.role === "admin" ? (
          <QuickLink
            title="Portal Users"
            description="Manage admin and portal access"
            href="/users"
          />
        ) : null}
        <QuickLink
          title="Settings"
          description="Adjust preferences and account settings"
          href="/settings"
        />
      </div>

      {/* Tips */}
      <div className="rounded-xl border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-lg font-semibold text-black dark:text-white">Tips</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
          <li>Use the Transactions page for quick deposits and expenses.</li>
          <li>Portal Users is visible only for partners/admins.</li>
          <li>Visit Accounts to review balances before making changes.</li>
        </ul>
      </div>
    </div>
  );
}

function QuickLink({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-stroke bg-white p-5 transition hover:border-primary hover:shadow-sm dark:border-strokedark dark:bg-boxdark"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-black dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>
        </div>
        <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-stroke text-primary transition group-hover:bg-primary group-hover:text-white dark:border-strokedark">
          →
        </span>
      </div>
    </Link>
  );
}
