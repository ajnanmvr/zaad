import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roleService } from '@/services/role.service';
import { permissionService } from '@/services/permission.service';
import { createRoleSchema, type CreateRoleInput } from '@/lib/validations/role';
import type { Permission } from '@/lib/validations/permission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface RoleFormData {
  name: string;
  description?: string;
}

export default function RoleForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RoleFormData>({
    resolver: zodResolver(createRoleSchema.omit({ permissionIds: true })),
  });

  useEffect(() => {
    loadPermissions();
    if (isEdit) {
      loadRole();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPermissions = async () => {
    try {
      const response = await permissionService.listPermissions();
      setPermissions(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    }
  };

  const loadRole = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await roleService.getRoleById(id);
      setValue('name', response.data.name);
      setValue('description', response.data.description || '');
      // Note: You'll need to get permissions from role detail endpoint
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load role');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RoleFormData) => {
    setLoading(true);
    setError('');

    try {
      const roleData: CreateRoleInput = {
        ...data,
        permissionIds: selectedPermissions,
      };

      if (isEdit && id) {
        await roleService.updateRole(id, {
          name: roleData.name,
          description: roleData.description,
        });
        if (selectedPermissions.length > 0) {
          await roleService.assignPermissions(id, { permissionIds: selectedPermissions });
        }
      } else {
        await roleService.createRole(roleData);
      }

      navigate('/roles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          {isEdit ? 'Edit Role' : 'Create Role'}
        </h1>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                {...register('name')}
                disabled={loading}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                disabled={loading}
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label>Permissions</Label>
              {Object.keys(groupedPermissions).length === 0 ? (
                <p className="text-sm text-gray-500">No permissions available</p>
              ) : (
                Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-semibold text-sm uppercase text-gray-600 dark:text-gray-400">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {perms.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-center space-x-2 p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            disabled={loading}
                            className="rounded"
                          />
                          <span className="text-sm">{permission.description}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : isEdit ? 'Update Role' : 'Create Role'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/roles')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
