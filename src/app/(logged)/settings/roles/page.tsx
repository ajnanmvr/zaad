"use client";

import { FormEvent, useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUserContext } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";

type RoleView = {
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
};

const RolesPage = () => {
  const { user } = useUserContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionsInput, setPermissionsInput] = useState("");
  const [editingRoleName, setEditingRoleName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canManageRoles =
    Array.isArray(user?.permissions) && user.permissions.includes("roles.manage");

  if (user && !canManageRoles) {
    router.push("/");
  }

  const query = useQuery({
    queryKey: ["roles-list"],
    queryFn: async () => {
      const { data } = await axios.get("/api/roles");
      return data.roles as RoleView[];
    },
    enabled: canManageRoles,
  });

  const roles = useMemo(() => query.data || [], [query.data]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPermissionsInput("");
    setEditingRoleName(null);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();

    const parsedPermissions = permissionsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!name.trim() || parsedPermissions.length === 0) {
      return;
    }

    setLoading(true);
    try {
      if (editingRoleName) {
        await axios.put(`/api/roles/${encodeURIComponent(editingRoleName)}`, {
          description: description.trim(),
          permissions: parsedPermissions,
        });
      } else {
        await axios.post("/api/roles", {
          name: name.trim(),
          description: description.trim(),
          permissions: parsedPermissions,
        });
      }

      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["roles-list"] });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (role: RoleView) => {
    setEditingRoleName(role.name);
    setName(role.name);
    setDescription(role.description || "");
    setPermissionsInput(role.permissions.join(", "));
  };

  const handleDelete = async (roleName: string) => {
    if (!confirm(`Delete role ${roleName}?`)) {
      return;
    }

    await axios.delete(`/api/roles/${encodeURIComponent(roleName)}`);
    await queryClient.invalidateQueries({ queryKey: ["roles-list"] });
  };

  if (!user || !canManageRoles) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Role Management" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 xl:col-span-5">
          <h2 className="mb-4 text-lg font-semibold">{editingRoleName ? "Edit Role" : "Create Role"}</h2>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div>
              <label className="mb-2 block text-sm font-medium">Role Name</label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="example: finance_manager"
                disabled={Boolean(editingRoleName)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Description</label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Permissions</label>
              <textarea
                className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={permissionsInput}
                onChange={(e) => setPermissionsInput(e.target.value)}
                placeholder="users.read, users.create, invoice.read"
              />
              <p className="mt-1 text-xs text-slate-500">Comma separated permission keys.</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Saving..." : editingRoleName ? "Update Role" : "Create Role"}
            </button>
            {editingRoleName && (
              <button
                type="button"
                onClick={resetForm}
                className="ml-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-700"
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 xl:col-span-7">
          <h2 className="mb-4 text-lg font-semibold">Existing Roles</h2>
          <div className="space-y-3">
            {roles.map((role) => (
              <div
                key={role.name}
                className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{role.name}</h3>
                    {role.description && (
                      <p className="text-xs text-slate-500">{role.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700"
                      onClick={() => startEdit(role)}
                      disabled={Boolean(role.isSystem)}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 disabled:opacity-50 dark:border-red-700 dark:text-red-400"
                      onClick={() => handleDelete(role.name)}
                      disabled={Boolean(role.isSystem)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {role.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default RolesPage;
