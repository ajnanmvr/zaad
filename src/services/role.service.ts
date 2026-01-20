import apiClient from '@/lib/api-client';
import type {
  Role,
  CreateRoleInput,
  UpdateRoleInput,
  AssignPermissionsInput,
  AddPermissionInput,
} from '@/lib/validations/role';

interface RoleResponse {
  data: Role;
  message: string;
}

interface RolesResponse {
  data: Role[];
  message: string;
}

interface MessageResponse {
  message: string;
}

export const roleService = {
  async listRoles(): Promise<RolesResponse> {
    return apiClient.get<RolesResponse>('/roles');
  },

  async getRoleById(roleId: string): Promise<RoleResponse> {
    return apiClient.get<RoleResponse>(`/roles/${roleId}`);
  },

  async createRole(data: CreateRoleInput): Promise<RoleResponse> {
    return apiClient.post<RoleResponse>('/roles', data);
  },

  async updateRole(roleId: string, data: UpdateRoleInput): Promise<RoleResponse> {
    return apiClient.put<RoleResponse>(`/roles/${roleId}`, data);
  },

  async deleteRole(roleId: string): Promise<MessageResponse> {
    return apiClient.delete<MessageResponse>(`/roles/${roleId}`);
  },

  async assignPermissions(
    roleId: string,
    data: AssignPermissionsInput
  ): Promise<RoleResponse> {
    return apiClient.put<RoleResponse>(`/roles/${roleId}/permissions`, data);
  },

  async addPermission(
    roleId: string,
    data: AddPermissionInput
  ): Promise<RoleResponse> {
    return apiClient.post<RoleResponse>(`/roles/${roleId}/permissions`, data);
  },

  async removePermission(
    roleId: string,
    permissionId: string
  ): Promise<MessageResponse> {
    return apiClient.delete<MessageResponse>(
      `/roles/${roleId}/permissions/${permissionId}`
    );
  },
};
