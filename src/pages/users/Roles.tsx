import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userService } from "@/services/user.service";
import { roleService } from "@/services/role.service";
import type { User } from "@/lib/validations/user";
import type { Role } from "@/lib/validations/role";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function UserRoles() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [userRes, rolesRes] = await Promise.all([
        userService.getUser(id),
        roleService.listRoles(),
      ]);

      setUser(userRes);
      setAllRoles(rolesRes.data || []);
      setSelectedRoles((userRes.roles || []).map((r: { id: string }) => r.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      setIsSaving(true);
      setError("");

      // Get current roles
      const currentRoles = (user?.roles || []).map((r: { id: string }) => r.id);

      // Find roles to add and remove
      const rolesToAdd = selectedRoles.filter((r) => !currentRoles.includes(r));
      const rolesToRemove = currentRoles.filter(
        (r) => !selectedRoles.includes(r)
      );

      // Add new roles
      for (const roleId of rolesToAdd) {
        await userService.assignRoleToUser(id, roleId);
      }

      // Remove roles
      for (const roleId of rolesToRemove) {
        await userService.removeRoleFromUser(id, roleId);
      }

      navigate(`/users/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save roles");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button variant="outline" onClick={() => navigate("/users")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mt-6">
          <p className="text-sm text-red-600 dark:text-red-400">
            User not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Button
        variant="outline"
        onClick={() => navigate(`/users/${id}`)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="mt-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Manage Roles</h1>
          <p className="text-gray-500 mt-2">Assign roles to {user.name}</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6">Available Roles</h2>

          <div className="space-y-4 mb-6">
            {allRoles.length === 0 ? (
              <p className="text-gray-500">No roles available</p>
            ) : (
              allRoles.map((role) => (
                <div key={role.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`role-${role.id}`}
                    checked={selectedRoles.includes(role.id)}
                    onChange={() => handleRoleToggle(role.id)}
                    className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor={`role-${role.id}`}
                    className="ml-3 cursor-pointer flex-1"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {role.name}
                      </p>
                      {role.description && (
                        <p className="text-sm text-gray-500">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/users/${id}`)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
