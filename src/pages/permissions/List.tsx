import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { permissionService } from '@/services/permission.service';
import type { Permission } from '@/lib/validations/permission';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

export default function PermissionList() {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await permissionService.listPermissions();
      setPermissions(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      await permissionService.deletePermission(deleteId);
      setPermissions(permissions.filter(perm => perm.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete permission');
    } finally {
      setIsDeleting(false);
    }
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading permissions...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Permissions</h1>
        <Button onClick={() => navigate('/permissions/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Permission
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-8">
        {Object.keys(groupedPermissions).length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No permissions found</p>
          </Card>
        ) : (
          Object.entries(groupedPermissions).map(([category, perms]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold mb-4 uppercase text-gray-700 dark:text-gray-300">
                {category}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {perms.map((permission) => (
                  <Card key={permission.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-mono text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {permission.key}
                        </p>
                        <p className="text-sm">{permission.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(permission.id)}
                        className="ml-2"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <DeleteConfirmationDialog
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Permission"
        description="Are you sure you want to delete this permission? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
}
