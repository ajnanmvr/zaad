import { z } from 'zod';

// Permission Schema
export const permissionSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  description: z.string(),
  category: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Permission = z.infer<typeof permissionSchema>;

// Create Permission Schema
export const createPermissionSchema = z.object({
  key: z.string().min(3, 'Permission key must be at least 3 characters'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  category: z.string().min(2, 'Category must be at least 2 characters'),
});

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;

// Bulk Create Permissions Schema
export const bulkCreatePermissionsSchema = z.object({
  permissions: z.array(createPermissionSchema).min(1, 'At least one permission is required'),
});

export type BulkCreatePermissionsInput = z.infer<typeof bulkCreatePermissionsSchema>;

// Update Permission Schema
export const updatePermissionSchema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters').optional(),
  category: z.string().min(2, 'Category must be at least 2 characters').optional(),
});

export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
