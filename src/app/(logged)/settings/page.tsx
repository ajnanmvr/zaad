"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  FiActivity,
  FiBriefcase,
  FiClock,
  FiKey,
  FiLayers,
  FiLink,
  FiSettings,
  FiShield,
  FiUser,
  FiUsers,
} from "react-icons/fi";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ChangePassword from "@/components/Forms/ChangePassword";
import SessionManager from "@/components/Settings/SessionManager";
import { useUserContext } from "@/contexts/UserContext";

type ActivityItem = {
  _id: string;
  action: string;
  targetUser?: { username?: string };
  performedBy?: { username?: string };
  createdAt: string;
};

type ActivityResponse = {
  activities: ActivityItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalActivities: number;
    hasMore: boolean;
  };
};

const formatAction = (action: string) => action.replace(/_/g, " ");

const SettingsPage = () => {
  const { user } = useUserContext();

  const canViewRoles =
    Array.isArray(user?.permissions) &&
    (user.permissions.includes("settings.read") ||
      user.permissions.includes("roles.manage"));
  const canViewPermissions =
    Array.isArray(user?.permissions) && user.permissions.includes("settings.read");
  const canViewTemplates =
    Array.isArray(user?.permissions) && user.permissions.includes("entities.write");
  const canViewAudit =
    Array.isArray(user?.permissions) && user.permissions.includes("users.activity.read");
  const canViewUsers =
    Array.isArray(user?.permissions) && user.permissions.includes("users.read");

  const activitiesQuery = useQuery({
    queryKey: ["my-activity", user?._id],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/users/activity?userId=${encodeURIComponent(user?._id || "")}&limit=8`,
      );
      return data as ActivityResponse;
    },
    enabled: Boolean(user?._id) && canViewAudit,
  });

  const activities = useMemo(
    () => activitiesQuery.data?.activities || [],
    [activitiesQuery.data?.activities],
  );

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <Breadcrumb pageName="Settings" />

      <section className="relative mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-100">
            <FiSettings />
            Settings Hub
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Settings, access, and templates
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-200/80">
            Every settings section now has its own page. Use the cards below or the sidebar links to move directly to the area you need.
          </p>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link href="/settings/document-types" className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Types & Platforms</p>
              <h3 className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">Template catalogs</h3>
            </div>
            <FiLayers className="text-2xl text-cyan-500" />
          </div>
          <p className="mt-3 text-sm text-slate-500">Document types, credential platforms, payment methods, payment statuses, and suggestion lists.</p>
        </Link>

        <Link href="/settings/roles" className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Access</p>
              <h3 className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">Roles & permissions</h3>
            </div>
            <FiShield className="text-2xl text-emerald-500" />
          </div>
          <p className="mt-3 text-sm text-slate-500">Manage role definitions and inspect grouped permissions from one page.</p>
        </Link>

        <Link href="/settings/particular-suggestions" className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Payments</p>
              <h3 className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">Particular suggestions</h3>
            </div>
            <FiLink className="text-2xl text-amber-500" />
          </div>
          <p className="mt-3 text-sm text-slate-500">Review, publish, or delete the saved transaction description suggestions.</p>
        </Link>

        <Link href="/users" className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Administration</p>
              <h3 className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">System users</h3>
            </div>
            <FiUsers className="text-2xl text-violet-500" />
          </div>
          <p className="mt-3 text-sm text-slate-500">Open the user management console and review accounts quickly.</p>
        </Link>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="xl:col-span-5 space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/15 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-sky-500/10 blur-2xl" />

            <div className="relative">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <FiUser className="text-3xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {user?.fullname || user?.username || "Loading"}
                  </h2>
                  <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-500">
                    <FiBriefcase />
                    {user?.role || "User"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Username</p>
                  <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{user?.username || "-"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Role</p>
                  <p className="mt-1 inline-flex items-center gap-2 font-semibold capitalize text-slate-800 dark:text-slate-200">
                    <FiShield className="text-emerald-500" />
                    {user?.role || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Granted Permissions</p>
                  <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                    {Array.isArray(user?.permissions) ? user.permissions.length : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Security Shortcuts</h3>
            <div className="flex flex-wrap gap-2">
              {canViewRoles ? (
                <Link
                  href="/settings/roles"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Role Management
                </Link>
              ) : null}
              {canViewPermissions ? (
                <Link
                  href="/settings/permissions"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Permission Matrix
                </Link>
              ) : null}
              {canViewTemplates ? (
                <>
                  <Link
                    href="/settings/document-types"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Templates & Platforms
                  </Link>
                  <Link
                    href="/settings/payment-statuses"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Payment Statuses
                  </Link>
                  <Link
                    href="/settings/particular-suggestions"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Particular Suggestions
                  </Link>
                </>
              ) : null}
              {canViewUsers ? (
                <Link
                  href="/users"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  System Users
                </Link>
              ) : null}
              {canViewAudit ? (
                <Link
                  href="/users/activity"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Activity Audit
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="xl:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-4 flex items-center gap-2">
              <FiActivity className="text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Activities</h3>
            </div>

            {!canViewAudit ? (
              <p className="text-sm text-slate-500">You do not have permission to view activity logs.</p>
            ) : activitiesQuery.isLoading ? (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading activity...
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-slate-500">No activity found for your account.</p>
            ) : (
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div
                    key={activity._id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60"
                  >
                    <div>
                      <p className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                        {formatAction(activity.action)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Target: {activity.targetUser?.username || "n/a"} | Actor: {activity.performedBy?.username || "n/a"}
                      </p>
                    </div>
                    <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <FiClock />
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ChangePassword />
          <SessionManager />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
              <FiKey className="text-emerald-500" />
              Account Safety Tips
            </h3>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <li>Use a strong unique password and update it periodically.</li>
              <li>Review active sessions and revoke devices you do not recognize.</li>
              <li>Report unexpected role or permission changes immediately.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
