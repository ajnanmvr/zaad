import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { permissionService } from '@/services/permission.service';
import { createPermissionSchema, type CreatePermissionInput } from '@/lib/validations/permission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function PermissionForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePermissionInput>({
    resolver: zodResolver(createPermissionSchema),
  });

  const onSubmit = async (data: CreatePermissionInput) => {
    setLoading(true);
    setError('');

    try {
      await permissionService.createPermission(data);
      navigate('/permissions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create permission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Permission</h1>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="key">Permission Key *</Label>
              <Input
                id="key"
                placeholder="e.g., users.create"
                {...register('key')}
                disabled={loading}
                className={errors.key ? 'border-red-500' : ''}
              />
              {errors.key && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.key.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Format: category.action (e.g., users.create, invoices.read)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                placeholder="e.g., Create new users"
                {...register('description')}
                disabled={loading}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                placeholder="e.g., users, invoices, roles"
                {...register('category')}
                disabled={loading}
                className={errors.category ? 'border-red-500' : ''}
              />
              {errors.category && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Permission'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/permissions')}
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
