import apiClient from '@/lib/api-client';
import type {
  LoginInput,
  ChangePasswordInput,
} from '@/lib/validations/auth';
import type { User } from '@/lib/validations/user';
import { useAuthStore } from '@/store/authStore';

interface LoginResponse {
  data: {
    user: User;
    accessToken: string;
  };
  message: string;
}

interface RefreshTokenResponse {
  data: {
    accessToken: string;
  };
  message: string;
}

interface UserResponse {
  data: User;
  message: string;
}

interface MessageResponse {
  message: string;
}

export const authService = {
  async login(credentials: LoginInput): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      credentials
    );

    // Store auth data (refresh token is in httpOnly cookie)
    useAuthStore.getState().setAuth(
      response.data.data.user,
      response.data.data.accessToken
    );

    return response.data;
  },

  async refreshToken(): Promise<RefreshTokenResponse> {
    // No body needed - refresh token is sent automatically via httpOnly cookie
    const response = await apiClient.post<RefreshTokenResponse>(
      '/auth/refresh',
      {}
    );

    // Update access token
    useAuthStore.getState().setAccessToken(response.data.data.accessToken);

    return response.data;
  },

  async getCurrentUser(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>('/auth/me');

    // Update user data in store
    useAuthStore.getState().updateUser(response.data.data);

    return response.data;
  },

  async changePassword(data: ChangePasswordInput): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>('/auth/change-password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    return response.data;
  },

  async logout(): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>('/auth/logout', {});
    
    // Clear auth state
    useAuthStore.getState().clearAuth();
    
    return response.data;
  },

  async initializeAuth(): Promise<boolean> {
    try {
      // Try to get current user (will auto-refresh if needed)
      await this.getCurrentUser();
      useAuthStore.getState().setInitialized(true);
      return true;
    } catch {
      // If /auth/me fails, try to refresh
      try {
        await this.refreshToken();
        await this.getCurrentUser();
        useAuthStore.getState().setInitialized(true);
        return true;
      } catch {
        // Both failed, user needs to login
        useAuthStore.getState().clearAuth();
        useAuthStore.getState().setInitialized(true);
        return false;
      }
    }
  },
};
