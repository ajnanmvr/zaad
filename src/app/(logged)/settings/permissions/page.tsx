"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUserContext } from "@/contexts/UserContext";
import toast from "react-hot-toast";

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
  const canReadSettings =
    Array.isArray(user?.permissions) && user.permissions.includes("settings.read");
  const canWriteSettings =
    Array.isArray(user?.permissions) && user.permissions.includes("settings.write");

  const [activeRole, setActiveRole] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  if (user && !canReadSettings) {
    router.push("/");
  }

  const query = useQuery({
    queryKey: ["permissions-catalog"],
    queryFn: async () => {
      const { data } = await axios.get("/api/permissions");
      return data as PermissionResponse;
    },
    enabled: canReadSettings,
  });

  const roles = useMemo(() => query.data?.roles || [], [query.data]);
  const groups = query.data?.groups || {};
  const roleMap = useMemo(
    () =>
      new Map(
        roles.map((role) => [
          role.name,
          {
            ...role,
            permissionSet: new Set(role.permissions),
          },
        ])
      ),
    [roles]
  );

  const selectedRole = activeRole ? roleMap.get(activeRole) : undefined;

  const handleSelectRole = (roleName: string) => {
    const role = roleMap.get(roleName);
    setActiveRole(roleName);
    setSelectedPermissions(role ? Array.from(role.permissionSet) : []);
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission]
    );
  };

  const saveRolePermissions = async () => {
    if (!selectedRole || !canWriteSettings || selectedRole.isSystem) {
      return;
    }

    setIsSaving(true);
    try {
      await axios.put(`/api/roles/${encodeURIComponent(selectedRole.name)}`, {
        description: selectedRole.description || "",
        permissions: selectedPermissions,
      });
      await queryClient.invalidateQueries({ queryKey: ["permissions-catalog"] });
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 xl:col-span-4">
          <h2 className="mb-4 text-lg font-semibold">Roles</h2>
          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role.name}
                onClick={() => handleSelectRole(role.name)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  activeRole === role.name
                    ? "border-primary bg-primary/10"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{role.name}</span>
                  {role.isSystem && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] dark:bg-slate-800">
                      system
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 xl:col-span-8">
          <h2 className="mb-2 text-lg font-semibold">Permissions</h2>
          {!selectedRole ? (
            <p className="text-sm text-slate-500">Select a role to view or edit permissions.</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-500">
                Editing <span className="font-medium text-slate-700 dark:text-slate-200">{selectedRole.name}</span>
                {selectedRole.isSystem && " (system roles are read-only)"}
              </p>

              <div className="space-y-5">
                {Object.entries(groups).map(([group, permissions]) => (
                  <div key={group}>
                    <h3 className="mb-2 text-sm font-semibold capitalize">{group}</h3>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {permissions.map((permission) => {
                        const checked = selectedPermissions.includes(permission);
                        return (
                          <label
                            key={permission}
                            className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!canWriteSettings || Boolean(selectedRole.isSystem)}
                              onChange={() => togglePermission(permission)}
                            />
                            {permission}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {canWriteSettings && !selectedRole.isSystem && (
                <button
                  onClick={saveRolePermissions}
                  disabled={isSaving}
                  className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save Permissions"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PermissionsPage;
