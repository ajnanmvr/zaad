import apiClient from '@/lib/api-client';
import type {
  Permission,
  CreatePermissionInput,
  BulkCreatePermissionsInput,
  UpdatePermissionInput,
} from '@/lib/validations/permission';

interface PermissionResponse {
  data: Permission;
  message: string;
}

interface PermissionsResponse {
  data: Permission[];
  message: string;
}

interface CategoriesResponse {
  data: string[];
  message: string;
}

interface MessageResponse {
  message: string;
}

export const permissionService = {
  async listPermissions(): Promise<PermissionsResponse> {
    return apiClient.get<PermissionsResponse>('/permissions');
  },

  async getCategories(): Promise<CategoriesResponse> {
    return apiClient.get<CategoriesResponse>('/permissions/categories');
  },

  async getPermissionsByCategory(category: string): Promise<PermissionsResponse> {
    return apiClient.get<PermissionsResponse>(`/permissions/category/${category}`);
  },

  async getPermissionById(permissionId: string): Promise<PermissionResponse> {
    return apiClient.get<PermissionResponse>(`/permissions/${permissionId}`);
  },

  async createPermission(data: CreatePermissionInput): Promise<PermissionResponse> {
    return apiClient.post<PermissionResponse>('/permissions', data);
  },

  async bulkCreatePermissions(
    data: BulkCreatePermissionsInput
  ): Promise<PermissionsResponse> {
    return apiClient.post<PermissionsResponse>('/permissions/bulk', data);
  },

  async updatePermission(
    permissionId: string,
    data: UpdatePermissionInput
  ): Promise<PermissionResponse> {
    return apiClient.put<PermissionResponse>(`/permissions/${permissionId}`, data);
  },

  async deletePermission(permissionId: string): Promise<MessageResponse> {
    return apiClient.delete<MessageResponse>(`/permissions/${permissionId}`);
  },
};
