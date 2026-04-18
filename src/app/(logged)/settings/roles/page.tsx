"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  FiCheck,
  FiEdit2,
  FiLayers,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
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

type PermissionCatalogResponse = {
  groups: Record<string, string[]>;
};

const RolesPage = () => {
  const { user } = useUserContext();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editingRoleName, setEditingRoleName] = useState<string | null>(null);
  const [deleteRoleName, setDeleteRoleName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canReadRoles =
    Array.isArray(user?.permissions) &&
    (user.permissions.includes("settings.read") ||
      user.permissions.includes("roles.manage"));
  const canWriteRoles =
    Array.isArray(user?.permissions) &&
    (user.permissions.includes("settings.write") ||
      user.permissions.includes("roles.manage"));

  useEffect(() => {
    if (user && !canReadRoles) {
      router.push("/");
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

  const permissionsQuery = useQuery({
    queryKey: ["permissions-catalog-for-roles"],
    queryFn: async () => {
      const { data } = await axios.get("/api/permissions");
      return data as PermissionCatalogResponse;
    },
    enabled: canReadRoles,
  });

  const permissionGroupsData = permissionsQuery.data?.groups;
  const permissionGroups = useMemo(
    () => permissionGroupsData || {},
    [permissionGroupsData],
  );
  const allPermissions = useMemo(
    () => Object.values(permissionGroups).flat(),
    [permissionGroups],
  );

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

  const selectedCount = selectedPermissions.length;

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedPermissions([]);
    setEditingRoleName(null);
  };

  const startEdit = (role: RoleView) => {
    setEditingRoleName(role.name);
    setName(role.name);
    setDescription(role.description || "");
    setSelectedPermissions(role.permissions);
  };

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

  const selectAll = () => setSelectedPermissions(allPermissions);
  const clearAll = () => setSelectedPermissions([]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!canWriteRoles) return;
    if (!name.trim() || selectedPermissions.length === 0) return;

    setIsSaving(true);
    try {
      if (editingRoleName) {
        await axios.put(`/api/roles/${encodeURIComponent(editingRoleName)}`, {
          description: description.trim(),
          permissions: selectedPermissions,
        });
      } else {
        await axios.post("/api/roles", {
          name: name.trim(),
          description: description.trim(),
          permissions: selectedPermissions,
        });
      }

      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["roles-list"] });
      await queryClient.invalidateQueries({ queryKey: ["permissions-catalog"] });
    } finally {
      setIsSaving(false);
    }
  };

  const performDelete = async () => {
    if (!deleteRoleName) return;
    await axios.delete(`/api/roles/${encodeURIComponent(deleteRoleName)}`);
    await queryClient.invalidateQueries({ queryKey: ["roles-list"] });
    await queryClient.invalidateQueries({ queryKey: ["permissions-catalog"] });
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
    <>
      <Breadcrumb pageName="Role Management" />

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

      <section className="relative mb-6 overflow-hidden rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5 shadow-sm dark:border-indigo-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-300/60 bg-indigo-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-700/40 dark:bg-indigo-900/30 dark:text-indigo-300">
            <FiLayers />
            Access Control
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Role Management Console
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Create and tune business roles with grouped permissions that map to your API capabilities.
          </p>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
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
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Permissions Selected</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">{selectedCount}</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50 xl:col-span-4">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Roles</h2>
          <div className="space-y-2">
            {filteredRoles.map((role) => (
              <div
                key={role.name}
                className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{role.name}</p>
                    {role.description ? (
                      <p className="mt-0.5 text-xs text-slate-500">{role.description}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-500">{role.permissions.length} permissions</p>
                  </div>
                  {role.isSystem ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold dark:bg-slate-800">system</span>
                  ) : null}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(role)}
                    disabled={Boolean(role.isSystem) || !canWriteRoles}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 dark:border-slate-700"
                  >
                    <FiEdit2 />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteRoleName(role.name)}
                    disabled={Boolean(role.isSystem) || !canWriteRoles}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-2.5 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-50 dark:border-rose-700 dark:text-rose-300"
                  >
                    <FiTrash2 />
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {filteredRoles.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
                No roles found.
              </p>
            ) : null}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50 xl:col-span-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {editingRoleName ? "Edit Role" : "Create Role"}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAll}
                disabled={!canWriteRoles}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 dark:border-slate-700"
              >
                <FiCheck />
                Select all
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={!canWriteRoles}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 dark:border-slate-700"
              >
                <FiX />
                Clear
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Role Name</label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="example: finance_manager"
                  disabled={Boolean(editingRoleName) || !canWriteRoles}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Description</label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What this role can do"
                  disabled={!canWriteRoles}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Permissions ({selectedCount})
                </p>
                {!canWriteRoles ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400">Read-only mode</p>
                ) : null}
              </div>

              <div className="max-h-[460px] space-y-4 overflow-y-auto pr-1">
                {Object.entries(permissionGroups).map(([group, permissions]) => {
                  const selectedInGroup = permissions.filter((permission) =>
                    selectedPermissions.includes(permission),
                  ).length;
                  return (
                    <div key={group} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{group}</p>
                        <button
                          type="button"
                          onClick={() => toggleGroup(permissions)}
                          disabled={!canWriteRoles}
                          className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium disabled:opacity-50 dark:border-slate-700"
                        >
                          {selectedInGroup === permissions.length ? "Clear group" : "Select group"}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {permissions.map((permission) => (
                          <label
                            key={permission}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-sm dark:border-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission)}
                              onChange={() => togglePermission(permission)}
                              disabled={!canWriteRoles}
                            />
                            <span>{permission}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!canWriteRoles || isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {editingRoleName ? <FiEdit2 /> : <FiPlus />}
                {isSaving
                  ? "Saving..."
                  : editingRoleName
                    ? "Update Role"
                    : "Create Role"}
              </button>

              {editingRoleName ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-700"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">All groups</p>
            <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">Permission overview</h3>
            <p className="mt-1 text-sm text-slate-500">
              Group, permission, and role coverage in one table.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <span
                key={role.name}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700 dark:text-slate-400"
              >
                {role.name}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Group</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Permission</th>
                {roles.map((role) => (
                  <th
                    key={role.name}
                    className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                  >
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(permissionGroups).flatMap(([group, permissions]) =>
                permissions.map((permission) => (
                  <tr key={`${group}-${permission}`} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {group}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {permission}
                    </td>
                    {roles.map((role) => {
                      const hasPermission = role.permissions.includes(permission);
                      return (
                        <td key={`${group}-${permission}-${role.name}`} className="px-4 py-3 text-center">
                          <span
                            className={
                              hasPermission
                                ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                : "inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                            }
                          >
                            {hasPermission ? "✓" : "–"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default RolesPage;
