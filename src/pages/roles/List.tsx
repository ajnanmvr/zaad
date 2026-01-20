import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roleService } from '@/services/role.service';
import type { Role } from '@/lib/validations/role';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

export default function RoleList() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.listRoles();
      setRoles(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      await roleService.deleteRole(deleteId);
      setRoles(roles.filter(role => role.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading roles...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Roles</h1>
        <Button onClick={() => navigate('/roles/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Role
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid gap-4">
        {roles.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No roles found</p>
          </Card>
        ) : (
          roles.map((role) => (
            <Card key={role.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{role.name}</h3>
                  {role.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {role.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Created: {new Date(role.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(`/roles/${role.id}/edit`)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteId(role.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <DeleteConfirmationDialog
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Role"
        description="Are you sure you want to delete this role? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
}
