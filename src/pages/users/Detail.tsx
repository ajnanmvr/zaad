import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userService } from "@/services/user.service";
import { User } from "@/lib/validations/user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Edit, Shield, Mail, User as UserIcon } from "lucide-react";

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await userService.getUser(id);
      setUser(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading user details...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button variant="outline" onClick={() => navigate("/users")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mt-6">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error || "User not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => navigate("/users")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Users
      </Button>

      <div className="mt-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-gray-500 mt-2">User ID: {user.id}</p>
          </div>
          <Button onClick={() => navigate(`/users/${user.id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit User
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Full Name
                </label>
                <p className="text-gray-900 dark:text-white">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Username
                </label>
                <p className="text-gray-900 dark:text-white">{user.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Email
                </label>
                <div className="flex items-center mt-1">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <p className="text-gray-900 dark:text-white">{user.email}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <span
                  className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    user.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                  }`}
                >
                  {user.status}
                </span>
              </div>
            </div>
          </Card>

          {/* Roles & Permissions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Roles & Permissions</h2>
            <div className="space-y-4">
              {user.roles && user.roles.length > 0 ? (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">
                    Assigned Roles
                  </label>
                  <div className="space-y-2">
                    {user.roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        <Shield className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="text-sm font-medium">{role.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No roles assigned</p>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/users/${user.id}/roles`)}
              >
                <Shield className="w-4 h-4 mr-2" />
                Manage Roles
              </Button>
            </div>
          </Card>

          {/* Additional Information */}
          <Card className="p-6 md:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Created At
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Last Updated
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
