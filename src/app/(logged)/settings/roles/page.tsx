"use client";

import Link from "next/link";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiEdit2,
  FiLayers,
  FiPlus,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { useUserContext } from "@/contexts/UserContext";

type RoleView = {
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
};

export default function RolesPage() {
  const { user } = useUserContext();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [deleteRoleName, setDeleteRoleName] = useState<string | null>(null);

  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canReadRoles =
    userPermissions.includes("settings.read") ||
    userPermissions.includes("roles.manage") ||
    userPermissions.includes("settings.manage.roles") ||
    userPermissions.includes("settings.manage.permissions");
  const canWriteRoles =
    userPermissions.includes("settings.write") ||
    userPermissions.includes("roles.manage") ||
    userPermissions.includes("settings.manage.roles");

  useEffect(() => {
    if (user && !canReadRoles) {
      router.push("/not-permitted");
    }
  }, [user, canReadRoles, router]);

  const rolesQuery = useQuery({
    queryKey: ["roles-list"],
    queryFn: async () => {
      const { data } = await axios.get("/api/roles");
      return data.roles as RoleView[];
    },
    enabled: canReadRoles,
  });

  const roles = useMemo(() => rolesQuery.data || [], [rolesQuery.data]);

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles;
    const needle = search.toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(needle) ||
        (role.description || "").toLowerCase().includes(needle),
    );
  }, [roles, search]);

  const performDelete = async () => {
    if (!deleteRoleName) return;
    await axios.delete(`/api/roles/${encodeURIComponent(deleteRoleName)}`);
    await queryClient.invalidateQueries({ queryKey: ["roles-list"] });
    setDeleteRoleName(null);
  };

  if (!user || !canReadRoles) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <Breadcrumb pageName="Roles" />

      <ConfirmationModal
        isOpen={Boolean(deleteRoleName)}
        title="Delete Role"
        message={`Delete role ${deleteRoleName}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onCancel={() => setDeleteRoleName(null)}
        onConfirm={() => {
          void performDelete();
        }}
      />

      <section className="mt-6 rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5 shadow-sm dark:border-indigo-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-300/60 bg-indigo-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-700/40 dark:bg-indigo-900/30 dark:text-indigo-300">
              <FiLayers />
              Access Control
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Roles
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Review roles here. Create and edit permissions on dedicated pages.
            </p>
          </div>

          <Link
            href="/settings/roles/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <FiPlus />
            New Role
          </Link>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Roles</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">{roles.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">System Roles</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">
            {roles.filter((role) => role.isSystem).length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Filtered</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">{filteredRoles.length}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search roles"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
      </div>

      <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {filteredRoles.map((role) => (
          <article
            key={role.name}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{role.name}</h2>
                  {role.isSystem ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      System
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {role.description || "No description provided."}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {role.permissions.length} permissions
                </p>
              </div>
              <FiArrowRight className="text-slate-400" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/settings/roles/${encodeURIComponent(role.name)}/edit`}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  role.isSystem || !canWriteRoles
                    ? "pointer-events-none border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <FiEdit2 />
                Edit
              </Link>
              <button
                type="button"
                onClick={() => setDeleteRoleName(role.name)}
                disabled={role.isSystem || !canWriteRoles}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition disabled:opacity-50 dark:border-rose-700 dark:text-rose-300"
              >
                <FiTrash2 />
                Delete
              </button>
            </div>
          </article>
        ))}

        {filteredRoles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50">
            No roles found.
          </div>
        ) : null}
      </section>
    </div>
  );
}
