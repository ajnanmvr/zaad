import { z } from 'zod';

// Role Schema
export const roleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Role = z.infer<typeof roleSchema>;

// Create Role Schema
export const createRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()).default([]),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

// Update Role Schema
export const updateRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters').optional(),
  description: z.string().optional(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

// Assign Permissions Schema
export const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});

export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>;

// Add Single Permission Schema
export const addPermissionSchema = z.object({
  permissionId: z.string().uuid(),
});

export type AddPermissionInput = z.infer<typeof addPermissionSchema>;
