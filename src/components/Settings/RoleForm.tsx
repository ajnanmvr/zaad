"use client";

import Link from "next/link";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheck,
  FiEdit2,
  FiLayers,
  FiPlus,
  FiSearch,
  FiX,
} from "react-icons/fi";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { hasPermission } from "@/auth/permissions";
import { useUserContext } from "@/contexts/UserContext";

type RoleView = {
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
};

type PermissionCatalogResponse = {
  groups: Record<string, string[]>;
};

type RoleFormProps = {
  mode: "create" | "edit";
  roleName?: string;
};

export default function RoleForm({ mode, roleName }: RoleFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isUserLoading } = useUserContext();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canReadRoles =
    hasPermission(userPermissions, "settings.read") ||
    hasPermission(userPermissions, "roles.manage") ||
    hasPermission(userPermissions, "settings.manage.roles") ||
    hasPermission(userPermissions, "settings.manage.permissions");
  const canWriteRoles =
    hasPermission(userPermissions, "settings.write") ||
    hasPermission(userPermissions, "roles.manage") ||
    hasPermission(userPermissions, "settings.manage.roles");

  useEffect(() => {
    if (user && !canReadRoles) {
      router.replace("/not-permitted");
    }
  }, [user, canReadRoles, router]);

  const permissionsQuery = useQuery({
    queryKey: ["permissions-catalog-for-roles"],
    queryFn: async () => {
      const { data } = await axios.get("/api/permissions");
      return data as PermissionCatalogResponse;
    },
    enabled: canReadRoles,
  });

  const roleQuery = useQuery({
    queryKey: ["role-by-name", roleName],
    queryFn: async () => {
      const { data } = await axios.get(`/api/roles/${encodeURIComponent(roleName || "")}`);
      return data as { role: RoleView };
    },
    enabled: mode === "edit" && canReadRoles && Boolean(roleName),
  });

  const permissionGroups = useMemo(
    () => permissionsQuery.data?.groups || {},
    [permissionsQuery.data?.groups],
  );

  const orderedGroups = useMemo(
    () =>
      Object.entries(permissionGroups)
        .map(([group, permissions]) => ({ group, permissions }))
        .filter((entry) => entry.permissions.length > 0),
    [permissionGroups],
  );

  const filteredGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return orderedGroups;
    }

    return orderedGroups
      .map((entry) => ({
        ...entry,
        permissions: entry.permissions.filter(
          (permission) =>
            permission.toLowerCase().includes(needle) ||
            entry.group.toLowerCase().includes(needle),
        ),
      }))
      .filter((entry) => entry.permissions.length > 0);
  }, [orderedGroups, search]);

  const allPermissions = useMemo(
    () => Object.values(permissionGroups).flat(),
    [permissionGroups],
  );

  useEffect(() => {
    if (mode === "edit" && roleQuery.data?.role) {
      setName(roleQuery.data.role.name);
      setDescription(roleQuery.data.role.description || "");
      setSelectedPermissions(Array.isArray(roleQuery.data.role.permissions) ? roleQuery.data.role.permissions : []);
    }
  }, [mode, roleQuery.data?.role]);

  const loading =
    isUserLoading ||
    permissionsQuery.isLoading ||
    permissionsQuery.isFetching ||
    (mode === "edit" && roleQuery.isLoading);

  const role = roleQuery.data?.role;
  const isSystemRole = Boolean(role?.isSystem);

  const resetSelectedPermissions = () => setSelectedPermissions([]);
  const selectAllPermissions = () => setSelectedPermissions(allPermissions);

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission],
    );
  };

  const toggleGroup = (permissions: string[]) => {
    const shouldSelect = permissions.some(
      (permission) => !selectedPermissions.includes(permission),
    );

    setSelectedPermissions((prev) => {
      if (shouldSelect) {
        return Array.from(new Set([...prev, ...permissions]));
      }
      return prev.filter((permission) => !permissions.includes(permission));
    });
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!canWriteRoles || isSystemRole) return;

    const normalizedName = name.trim().toLowerCase();
    if (mode === "create" && !normalizedName) return;
    if (selectedPermissions.length === 0) return;

    setIsSaving(true);
    try {
      if (mode === "edit") {
        const targetName = roleName || role?.name || normalizedName;
        await axios.put(`/api/roles/${encodeURIComponent(targetName)}`, {
          description: description.trim(),
          permissions: selectedPermissions,
        });
      } else {
        await axios.post("/api/roles", {
          name: normalizedName,
          description: description.trim(),
          permissions: selectedPermissions,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["roles-list"] });
      await queryClient.invalidateQueries({ queryKey: ["permissions-catalog-for-roles"] });
      router.push("/settings/roles");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = selectedPermissions.length;

  if (!user || !canReadRoles) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <Breadcrumb pageName={mode === "edit" ? "Edit Role" : "Create Role"} />

      <section className="mt-6 rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5 shadow-sm dark:border-indigo-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-300/60 bg-indigo-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-700/40 dark:bg-indigo-900/30 dark:text-indigo-300">
              <FiLayers />
              Access Control
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              {mode === "edit" ? "Edit Role" : "Create Role"}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              {mode === "edit"
                ? "Adjust the role description and permission set."
                : "Create a role and assign permissions from grouped categories."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/settings/roles"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FiArrowLeft />
              Back to Roles
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Permission Groups</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">{orderedGroups.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Available Permissions</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">{allPermissions.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Selected</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">{selectedCount}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 xl:col-span-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Role Details</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Role Name
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="example: finance_manager"
                disabled={mode === "edit" || isSystemRole || !canWriteRoles}
              />
              {mode === "edit" ? (
                <p className="mt-1 text-xs text-slate-500">Role name is fixed after creation.</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What this role can do"
                disabled={isSystemRole || !canWriteRoles}
              />
            </div>

            {isSystemRole ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800/40 dark:bg-amber-500/10 dark:text-amber-300">
                System roles cannot be modified.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAllPermissions}
                disabled={!canWriteRoles || isSystemRole}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 dark:border-slate-700"
              >
                <FiCheck />
                Select all
              </button>
              <button
                type="button"
                onClick={resetSelectedPermissions}
                disabled={!canWriteRoles || isSystemRole}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 dark:border-slate-700"
              >
                <FiX />
                Clear all
              </button>
            </div>

            <button
              type="submit"
              disabled={!canWriteRoles || isSystemRole || isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {mode === "edit" ? <FiEdit2 /> : <FiPlus />}
              {isSaving ? "Saving..." : mode === "edit" ? "Update Role" : "Create Role"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 xl:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Permission Selection</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Search, group, and select permissions for this role.
              </p>
            </div>

            <div className="relative w-full sm:max-w-md">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search permissions or groups"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            {filteredGroups.map(({ group, permissions }) => {
              const selectedInGroup = permissions.filter((permission) => selectedPermissions.includes(permission)).length;
              return (
                <div key={group} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{group}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedInGroup} of {permissions.length} selected
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleGroup(permissions)}
                      disabled={!canWriteRoles || isSystemRole}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-semibold disabled:opacity-50 dark:border-slate-700"
                    >
                      {selectedInGroup === permissions.length ? "Clear group" : "Select group"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {permissions.map((permission) => {
                      const checked = selectedPermissions.includes(permission);
                      return (
                        <label
                          key={permission}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                            checked
                              ? "border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-700/50 dark:bg-cyan-500/10 dark:text-cyan-200"
                              : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(permission)}
                            disabled={!canWriteRoles || isSystemRole}
                          />
                          <span className="break-all">{permission}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredGroups.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
                No permissions match your search.
              </p>
            ) : null}
          </div>
        </section>
      </form>
    </div>
  );
}
