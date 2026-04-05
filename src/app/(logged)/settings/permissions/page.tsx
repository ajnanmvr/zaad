"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FiCheck, FiFilter, FiLayers, FiSave, FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUserContext } from "@/contexts/UserContext";

type RoleView = {
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
};

type PermissionResponse = {
  permissions: string[];
  groups: Record<string, string[]>;
  roles: RoleView[];
};

const PermissionsPage = () => {
  const { user } = useUserContext();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeRole, setActiveRole] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const canReadSettings =
    Array.isArray(user?.permissions) && user.permissions.includes("settings.read");
  const canWriteSettings =
    Array.isArray(user?.permissions) && user.permissions.includes("settings.write");

  useEffect(() => {
    if (user && !canReadSettings) {
      router.push("/");
    }
  }, [user, canReadSettings, router]);

  const query = useQuery({
    queryKey: ["permissions-catalog"],
    queryFn: async () => {
      const { data } = await axios.get("/api/permissions");
      return data as PermissionResponse;
    },
    enabled: canReadSettings,
  });

  const rolesData = query.data?.roles;
  const groupsData = query.data?.groups;
  const roles = useMemo(() => rolesData || [], [rolesData]);
  const groups = useMemo(() => groupsData || {}, [groupsData]);

  const roleMap = useMemo(
    () =>
      new Map(
        roles.map((role) => [
          role.name,
          {
            ...role,
            permissionSet: new Set(role.permissions),
          },
        ]),
      ),
    [roles],
  );

  const selectedRole = activeRole ? roleMap.get(activeRole) : undefined;

  const matrixRows = useMemo(() => {
    return Object.entries(groups).flatMap(([group, permissions]) =>
      permissions.map((permission) => ({ group, permission })),
    );
  }, [groups]);

  const filteredRows = useMemo(() => {
    return matrixRows.filter((row) => {
      const matchesGroup = !groupFilter || row.group === groupFilter;
      const matchesSearch =
        !search.trim() || row.permission.toLowerCase().includes(search.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [groupFilter, matrixRows, search]);

  const handleSelectRole = (roleName: string) => {
    const role = roleMap.get(roleName);
    setActiveRole(roleName);
    setSelectedPermissions(role ? Array.from(role.permissionSet) : []);
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission],
    );
  };

  const saveRolePermissions = async () => {
    if (!selectedRole || !canWriteSettings || selectedRole.isSystem) return;

    setIsSaving(true);
    try {
      await axios.put(`/api/roles/${encodeURIComponent(selectedRole.name)}`, {
        description: selectedRole.description || "",
        permissions: selectedPermissions,
      });
      await queryClient.invalidateQueries({ queryKey: ["permissions-catalog"] });
      await queryClient.invalidateQueries({ queryKey: ["roles-list"] });
      toast.success("Role permissions updated");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update role permissions");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || !canReadSettings) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Permission Matrix" />

      <section className="relative mb-6 overflow-hidden rounded-3xl border border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 shadow-sm dark:border-violet-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/60 bg-violet-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700 dark:border-violet-700/40 dark:bg-violet-900/30 dark:text-violet-300">
            <FiLayers />
            Security Matrix
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Role x Permission Mapping
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Audit current permission distribution and update role capabilities in one place.
          </p>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Roles</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">{roles.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Permission Groups</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">{Object.keys(groups).length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Permissions</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">{matrixRows.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Editing Role</p>
          <p className="mt-2 truncate text-xl font-black text-slate-900 dark:text-slate-100">{activeRole || "None"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50 xl:col-span-3">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
            <FiLayers /> Roles
          </h2>
          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role.name}
                type="button"
                onClick={() => handleSelectRole(role.name)}
                className={
                  activeRole === role.name
                    ? "w-full rounded-xl border border-primary bg-primary/10 p-3 text-left"
                    : "w-full rounded-xl border border-slate-200 p-3 text-left dark:border-slate-700"
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{role.name}</p>
                  {role.isSystem ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold dark:bg-slate-800">system</span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-500">{role.permissions.length} permissions</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50 xl:col-span-9">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Role x Permission Matrix</h2>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search permission"
                  className="rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div className="relative">
                <FiFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={groupFilter}
                  onChange={(event) => setGroupFilter(event.target.value)}
                  className="rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="">All groups</option>
                  {Object.keys(groups).map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Group</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Permission</th>
                  {roles.map((role) => (
                    <th key={role.name} className="px-3 py-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={`${row.group}-${row.permission}`} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{row.group}</td>
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{row.permission}</td>
                    {roles.map((role) => {
                      const hasPermission = role.permissions.includes(row.permission);
                      return (
                        <td key={`${row.permission}-${role.name}`} className="px-3 py-2 text-center">
                          {hasPermission ? (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                              <FiCheck className="text-[12px]" />
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedRole ? (
            <div className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Editing {selectedRole.name}
                </p>
                {selectedRole.isSystem ? (
                  <span className="text-xs text-amber-600 dark:text-amber-400">System role is read-only</span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {Object.entries(groups).map(([group, permissions]) => (
                  <div key={group} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{group}</p>
                    <div className="space-y-2">
                      {permissions.map((permission) => (
                        <label key={permission} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission)}
                            disabled={!canWriteSettings || Boolean(selectedRole.isSystem)}
                            onChange={() => togglePermission(permission)}
                          />
                          <span>{permission}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {canWriteSettings && !selectedRole.isSystem ? (
                <button
                  type="button"
                  onClick={saveRolePermissions}
                  disabled={isSaving}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <FiSave />
                  {isSaving ? "Saving..." : "Save Role Permissions"}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-500">Select a role to edit permissions.</p>
          )}
        </section>
      </div>
    </>
  );
};

export default PermissionsPage;
