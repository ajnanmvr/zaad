import apiClient from '@/lib/api-client';
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  ListUsersQuery,
} from '@/lib/validations/user';

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UserResponse {
  data: User;
  message: string;
}

interface MessageResponse {
  message: string;
}

export const userService = {
  async listUsers(query?: Partial<ListUsersQuery>): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query?.search) params.append('search', query.search);
    if (query?.status) params.append('status', query.status);

    const queryString = params.toString();
    return apiClient.get<PaginatedResponse<User>>(
      `/users${queryString ? `?${queryString}` : ''}`
    );
  },

  async getUser(id: string): Promise<User> {
    const response = await apiClient.get<UserResponse>(`/users/${id}`);
    return response.data;
  },

  async getUserById(id: string): Promise<UserResponse> {
    return apiClient.get<UserResponse>(`/users/${id}`);
  },

  async createUser(data: CreateUserInput): Promise<UserResponse> {
    return apiClient.post<UserResponse>('/users', data);
  },

  async updateUser(id: string, data: UpdateUserInput): Promise<UserResponse> {
    return apiClient.patch<UserResponse>(`/users/${id}`, data);
  },

  async deleteUser(id: string): Promise<MessageResponse> {
    return apiClient.delete<MessageResponse>(`/users/${id}`);
  },

  async changeUserPassword(
    id: string,
    data: { currentPassword: string; newPassword: string }
  ): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>(`/users/${id}/change-password`, data);
  },

  async assignRoleToUser(userId: string, roleId: string): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>(
      `/user-roles/${userId}/roles`,
      { roleId }
    );
  },

  async removeRoleFromUser(userId: string, roleId: string): Promise<MessageResponse> {
    return apiClient.delete<MessageResponse>(
      `/user-roles/${userId}/roles/${roleId}`
    );
  },
};
