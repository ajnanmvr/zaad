import { z } from 'zod';

// User Status Enum
export const userStatusSchema = z.enum(['active', 'inactive', 'suspended']);

// Role reference for users
const roleRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
});

// User Schema
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  username: z.string(),
  email: z.string().email(),
  status: userStatusSchema,
  roles: z.array(roleRefSchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;

// Create User Schema
export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  status: userStatusSchema.default('active'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Update User Schema
export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  status: userStatusSchema.optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// List Users Query Schema
export const listUsersQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: userStatusSchema.optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

